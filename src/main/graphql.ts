import { Server } from "http";

import { ApolloServer, makeExecutableSchema } from "apollo-server-express";
import isDev from "electron-is-dev";
import { Application } from "express";
import { execute, subscribe } from "graphql";
import { PubSub } from "graphql-subscriptions";
import { Nicovideo } from "niconico";
import { SubscriptionServer } from "subscriptions-transport-ws";

import karafriendsConfig from "../common/config";
import { HOSTNAME } from "../common/constants";
import rawSchema from "../common/schema.graphql";
import {
  downloadDamVideo,
  downloadNicoVideo,
  downloadYoutubeVideo,
} from "./../common/videoDownloader";
import { DkwebsysAPI, MinseiAPI, MinseiCredentials } from "./damApi";
import { YoutubeAPI } from "./youtubeApi";

import "regenerator-runtime/runtime"; // tslint:disable-line:no-submodule-imports

interface IDataSources {
  dataSources: {
    minsei: MinseiAPI;
    dkwebsys: DkwebsysAPI;
    youtube: YoutubeAPI;
  };
}

interface SongParent {
  readonly id: string;
  readonly name: string;
  readonly nameYomi: string;
  readonly artistName: string;
  readonly artistNameYomi: string;
  readonly lyricsPreview?: string | null;
  readonly vocalTypes?: string[];
  readonly tieUp?: string | null;
  readonly playtime?: number | null;
}

interface ArtistParent {
  readonly id: string;
  readonly name: string;
  readonly nameYomi: string;
  readonly songCount: number;
}

interface Artist extends ArtistParent {
  readonly songs: Connection<SongParent, string>;
}

interface Connection<NodeType, CursorType> {
  readonly edges: Edge<NodeType, CursorType>[];
  readonly pageInfo: PageInfo<CursorType>;
}

interface Edge<NodeType, CursorType> {
  readonly node: NodeType;
  readonly cursor: CursorType;
}

interface PageInfo<CursorType> {
  readonly hasPreviousPage: boolean;
  readonly hasNextPage: boolean;
  readonly startCursor: CursorType;
  readonly endCursor: CursorType;
}

interface CaptionLanguage {
  code: string;
  name: string;
}

interface VideoInfo {
  readonly author: string;
  readonly channelId: string;
  readonly lengthSeconds: number;
  readonly description: string;
  readonly title: string;
  readonly viewCount: number;
}

interface YoutubeVideoInfo extends VideoInfo {
  readonly __typename: "YoutubeVideoInfo";
  readonly captionLanguages: CaptionLanguage[];
  readonly keywords: string[];
}

interface YoutubeVideoInfoError {
  readonly __typename: "YoutubeVideoInfoError";
  readonly reason: string;
}

type YoutubeVideoInfoResult = YoutubeVideoInfo | YoutubeVideoInfoError;

interface NicoVideoInfo extends VideoInfo {
  readonly __typename: "NicoVideoInfo";
  readonly thumbnailUrl: string;
}

interface NicoVideoInfoError {
  readonly __typename: "NicoVideoInfoError";
  readonly reason: string;
}

type NicoVideoInfoResult = NicoVideoInfo | NicoVideoInfoError;

interface QueueItemInterface {
  readonly songId: string;
  readonly name: string;
  readonly artistName: string;
  readonly playtime?: number | null;
  readonly timestamp: string;
  readonly nickname: string;
}

interface DamQueueItem extends QueueItemInterface {
  readonly __typename: "DamQueueItem";
  readonly streamingUrlIdx: string;
}

interface YoutubeQueueItem extends QueueItemInterface {
  readonly __typename: "YoutubeQueueItem";
  readonly hasAdhocLyrics: boolean;
  readonly hasCaptions: boolean;
}

interface NicoQueueItem extends QueueItemInterface {
  readonly __typename: "NicoQueueItem";
}

type QueueItem = DamQueueItem | YoutubeQueueItem | NicoQueueItem;

type QueueSongInfo = {
  readonly __typename: "QueueSongInfo";
  readonly eta: number;
};

interface QueueSongError {
  readonly __typename: "QueueSongError";
  readonly reason: string;
}

type QueueSongResult = QueueSongInfo | QueueSongError;

type QueueDamSongInput = {
  readonly songId: string;
  readonly name: string;
  readonly artistName: string;
  readonly playtime?: number | null;
  readonly streamingUrlIdx: string;
  readonly nickname: string;
};

type QueueYoutubeSongInput = {
  readonly songId: string;
  readonly name: string;
  readonly artistName: string;
  readonly playtime?: number | null;
  readonly nickname: string;
  readonly adhocSongLyrics: string;
  readonly captionCode: string | null;
};

type QueueNicoSongInput = {
  readonly songId: string;
  readonly name: string;
  readonly artistName: string;
  readonly playtime?: number | null;
  readonly nickname: string;
};

interface HistoryItem {
  readonly song: SongParent;
  readonly playDate: string;
}

enum PlaybackState {
  PAUSED = "PAUSED",
  PLAYING = "PLAYING",
  RESTARTING = "RESTARTING",
  SKIPPING = "SKIPPING",
  WAITING = "WAITING",
}

type PushAdhocLyricsInput = {
  readonly lyric: string;
  readonly lyricIndex: number;
};

type AdhocLyricsEntry = {
  readonly lyric: string;
  readonly lyricIndex: number;
};

type NotARealDb = {
  currentSong: QueueItem | null;
  currentSongAdhocLyrics: AdhocLyricsEntry[];
  idToAdhocLyrics: Record<string, string[]>;
  playbackState: PlaybackState;
  songQueue: QueueItem[];
};

enum SubscriptionEvent {
  CurrentSongAdhocLyricsChanged = "CurrentSongAdhocLyricsChanged",
  PlaybackStateChanged = "PlaybackStateChanged",
  QueueChanged = "QueueChanged",
  QueueAdded = "QueueAdded",
}

const db: NotARealDb = {
  currentSong: null,
  currentSongAdhocLyrics: [],
  idToAdhocLyrics: {},
  playbackState: PlaybackState.WAITING,
  songQueue: [],
};

const pubsub = new PubSub();

const nicovideo = new Nicovideo();

interface WatchData {
  owner: {
    id: number;
    nickname: string;
  };
  video: {
    count: {
      view: number;
    };
    description: string;
    duration: number;
    title: string;
    thumbnail: {
      player: string;
    };
  };
}

function pushSongToQueue(queueItem: QueueItem): QueueSongResult {
  // Not very efficient, but surely the queue won't ever get so big that this would be considered expensive
  const songsQueuedByUser: number = db.songQueue.filter(
    (x) => x.nickname === queueItem.nickname
  ).length;
  if (
    karafriendsConfig.paxSongQueueLimit >= 0 &&
    songsQueuedByUser >= karafriendsConfig.paxSongQueueLimit
  ) {
    return {
      __typename: "QueueSongError",
      reason: `${queueItem.nickname} already has ${karafriendsConfig.paxSongQueueLimit} song(s) in the queue`,
    };
  }
  db.songQueue.push(queueItem);
  pubsub.publish(SubscriptionEvent.QueueChanged, {
    queueChanged: db.songQueue,
  });
  pubsub.publish(SubscriptionEvent.QueueAdded, {
    queueAdded: queueItem,
  });
  return {
    __typename: "QueueSongInfo",
    eta: db.songQueue.reduce((acc, cur) => acc + (cur.playtime || 0), 0),
  };
}

function cleanupAdhocSongLyrics(lyrics: string): string[] {
  return lyrics.split("\n").filter((entry) => entry.trim() !== "");
}

const resolvers = {
  Song: {
    id(parent: SongParent) {
      return parent.id;
    },
    name(parent: SongParent) {
      return parent.name;
    },
    nameYomi(parent: SongParent) {
      return parent.nameYomi;
    },
    artistName(parent: SongParent) {
      return parent.artistName;
    },
    artistNameYomi(parent: SongParent) {
      return parent.artistNameYomi;
    },
    lyricsPreview(parent: SongParent) {
      return parent.lyricsPreview || null;
    },
    vocalTypes(parent: SongParent) {
      return parent.vocalTypes || [];
    },
    tieUp(parent: SongParent) {
      return parent.tieUp || null;
    },
    playtime(parent: SongParent) {
      return parent.playtime || null;
    },
    streamingUrls(parent: SongParent, _: any, { dataSources }: IDataSources) {
      return dataSources.minsei.getMusicStreamingUrls(parent.id).then((data) =>
        data.list.map((info) => ({
          url: karafriendsConfig.useLowBitrateUrl
            ? info.lowBitrateUrl
            : info.highBitrateUrl,
        }))
      );
    },
    scoringData(parent: SongParent, _: any, { dataSources }: IDataSources) {
      return dataSources.minsei
        .getScoringData(parent.id)
        .then((data) => Array.from(new Uint8Array(data)));
    },
  },
  Artist: {
    id(parent: ArtistParent) {
      return parent.id;
    },
    name(parent: ArtistParent) {
      return parent.name;
    },
    nameYomi(parent: ArtistParent) {
      return parent.nameYomi;
    },
    songCount(parent: ArtistParent) {
      return parent.songCount;
    },
    songs(
      parent: ArtistParent,
      args: { first: number | null; after: string | null },
      { dataSources }: IDataSources
    ) {
      const firstInt = args.first || 0;
      const afterInt = args.after ? parseInt(args.after, 10) : 0;

      return dataSources.dkwebsys
        .getMusicListByArtist(parent.id, firstInt, afterInt)
        .then((result) => ({
          edges: result.list.map((song, i) => ({
            node: {
              id: song.requestNo,
              name: song.title,
              nameYomi: song.titleYomi,
              artistName: song.artist,
              artistNameYomi: song.artistYomi,
            },
            cursor: (firstInt + 1).toString(),
          })),
          pageInfo: {
            hasPreviousPage: false,
            hasNextPage: firstInt + afterInt < result.data.totalCount,
            startCursor: "0",
            endCursor: (firstInt + afterInt).toString(),
          },
        }));
    },
  },
  DamQueueItem: {
    streamingUrls(parent: DamQueueItem, _: any, { dataSources }: IDataSources) {
      return dataSources.minsei
        .getMusicStreamingUrls(parent.songId)
        .then((data) =>
          data.list.map((info) => ({
            url: karafriendsConfig.useLowBitrateUrl
              ? info.lowBitrateUrl
              : info.highBitrateUrl,
          }))
        );
    },
    scoringData(parent: DamQueueItem, _: any, { dataSources }: IDataSources) {
      return dataSources.minsei
        .getScoringData(parent.songId)
        .then((data) => Array.from(new Uint8Array(data)));
    },
  },
  Query: {
    adhocLyrics(_: any, args: { id: string }): string[] {
      return db.idToAdhocLyrics[args.id];
    },
    songsByName: (
      _: any,
      args: { name: string; first: number | null; after: string | null },
      { dataSources }: IDataSources
    ): Promise<Connection<SongParent, string>> => {
      const firstInt = args.first || 0;
      const afterInt = args.after ? parseInt(args.after, 10) : 0;

      return dataSources.dkwebsys
        .getMusicByKeyword(args.name, firstInt, afterInt)
        .then((result) => ({
          edges: result.list.map((song, i) => ({
            node: {
              id: song.requestNo,
              name: song.title,
              nameYomi: song.titleYomi,
              artistName: song.artist,
              artistNameYomi: song.artistYomi,
            },
            cursor: (firstInt + i).toString(),
          })),
          pageInfo: {
            hasPreviousPage: false, // We can always do this because we don't support backward pagination
            hasNextPage: firstInt + afterInt < result.data.totalCount,
            startCursor: "0",
            endCursor: (firstInt + afterInt).toString(),
          },
        }));
    },
    songById: (
      _: any,
      args: { id: string },
      { dataSources }: IDataSources
    ): Promise<SongParent> =>
      dataSources.dkwebsys.getMusicDetailsInfo(args.id).then((data) => ({
        id: args.id,
        name: data.data.title,
        nameYomi: data.data.titleYomi_Kana,
        artistName: data.data.artist,
        artistNameYomi: "",
        lyricsPreview: data.data.firstLine,
        vocalTypes: data.list[0].mModelMusicInfoList[0].guideVocal
          .split(",")
          .map((vocalType) => {
            switch (vocalType) {
              case "0":
                return "NORMAL";
              case "1":
                return "GUIDE_MALE";
              case "2":
                return "GUIDE_FEMALE";
              default:
                console.warn(`unknown vocal type ${vocalType}`);
                return "UNKNOWN";
            }
          }),
        tieUp: data.list[0].mModelMusicInfoList[0].highlightTieUp,
        playtime: parseInt(data.list[0].mModelMusicInfoList[0].playtime, 10),
      })),
    artistsByName: (
      _: any,
      args: { name: string; first: number | null; after: string | null },
      { dataSources }: IDataSources
    ): Promise<Connection<ArtistParent, string>> => {
      const firstInt = args.first || 0;
      const afterInt = args.after ? parseInt(args.after, 10) : 0;

      return dataSources.dkwebsys
        .getArtistByKeyword(args.name, firstInt, afterInt)
        .then((result) => ({
          edges: result.list.map((artist, i) => ({
            node: {
              id: artist.artistCode.toString(),
              name: artist.artist,
              nameYomi: artist.artistYomi,
              songCount: artist.holdMusicCount,
            },
            cursor: (firstInt + i).toString(),
          })),
          pageInfo: {
            hasPreviousPage: false, // We can always do this because we don't support backward pagination
            hasNextPage: firstInt + afterInt < result.data.totalCount,
            startCursor: "0",
            endCursor: (firstInt + afterInt).toString(),
          },
        }));
    },
    artistById: (
      _: any,
      args: { id: string; first: number | null; after: string | null },
      { dataSources }: IDataSources
    ): Promise<ArtistParent> => {
      const firstInt = args.first || 0;
      const afterInt = args.after ? parseInt(args.after, 10) : 0;

      return dataSources.dkwebsys
        .getMusicListByArtist(args.id, firstInt, afterInt)
        .then((data) => ({
          id: args.id,
          name: data.data.artist,
          nameYomi: data.data.artistYomi_Kana,
          songCount: data.data.totalCount,
        }));
    },
    currentSong: () => {
      return db.currentSong;
    },
    queue: () => {
      if (!db.songQueue.length) return [];
      return db.songQueue;
    },
    history: (
      _: any,
      args: { first: number | null; after: string | null },
      { dataSources }: IDataSources
    ): Promise<Connection<HistoryItem, string>> => {
      const firstInt = args.first || 0;
      const afterInt = args.after ? parseInt(args.after, 10) : 0;

      return dataSources.minsei
        .getPlayHistory(firstInt, afterInt)
        .then((result) => ({
          edges: result.list.map((song, i) => ({
            node: {
              song: {
                id: song.requestNo,
                name: song.contentsName,
                nameYomi: song.contentsYomi,
                artistName: song.artistName,
                artistNameYomi: "",
              },
              playDate: song.playDate,
            },
            cursor: (firstInt + i).toString(),
          })),
          pageInfo: {
            hasPreviousPage: false, // We can always do this because we don't support backward pagination
            hasNextPage:
              firstInt + afterInt < parseInt(result.data.dataCount, 10),
            startCursor: "0",
            endCursor: (firstInt + afterInt).toString(),
          },
        }));
    },
    youtubeVideoInfo: (
      _: any,
      args: { videoId: string },
      { dataSources }: IDataSources
    ): Promise<YoutubeVideoInfoResult> => {
      return dataSources.youtube.getVideoInfo(args.videoId).then((data) => {
        if (data.playabilityStatus.status !== "OK") {
          return {
            __typename: "YoutubeVideoInfoError",
            reason: data.playabilityStatus.reason,
          };
        }
        const captionLanguages: CaptionLanguage[] = [];
        if (data?.captions) {
          data.captions.playerCaptionsTracklistRenderer.captionTracks.forEach(
            (captionTrack) => {
              // auto-generated captions have a vssId that start with "a". Skip them
              if (captionTrack.vssId.startsWith("a")) {
                return;
              }
              captionLanguages.push({
                code: captionTrack.languageCode,
                name: captionTrack.name.simpleText,
              });
            }
          );
        }
        return {
          __typename: "YoutubeVideoInfo",
          author: data.videoDetails.author,
          captionLanguages,
          channelId: data.videoDetails.channelId,
          keywords: data.videoDetails.keywords,
          lengthSeconds: parseInt(data.videoDetails.lengthSeconds, 10),
          description: data.videoDetails.shortDescription,
          title: data.videoDetails.title,
          viewCount: parseInt(data.videoDetails.viewCount, 10),
        };
      });
    },
    nicoVideoInfo: async (
      _: any,
      args: { videoId: string }
    ): Promise<NicoVideoInfoResult> => {
      try {
        // @ts-ignore
        const watchData: WatchData = await nicovideo.watch(args.videoId);
        return {
          __typename: "NicoVideoInfo",
          author: watchData.owner.nickname,
          channelId: watchData.owner.id.toString(10),
          description: watchData.video.description,
          lengthSeconds: watchData.video.duration,
          title: watchData.video.title,
          thumbnailUrl: watchData.video.thumbnail.player,
          viewCount: watchData.video.count.view,
        };
      } catch (e) {
        return {
          __typename: "NicoVideoInfoError",
          reason: "Failed getting video info. Maybe an invalid VideoID?",
        };
      }
    },
    playbackState: () => db.playbackState,
  },
  Mutation: {
    queueDamSong: (
      _: any,
      args: { input: QueueDamSongInput },
      { dataSources }: IDataSources
    ): QueueSongResult => {
      const queueItem: DamQueueItem = {
        timestamp: Date.now().toString(),
        ...args.input,
        __typename: "DamQueueItem",
      };

      if (karafriendsConfig.predownloadDAM) {
        console.log(`Starting offline download of ${queueItem.songId}`);
        dataSources.minsei
          .getMusicStreamingUrls(queueItem.songId)
          .then((data) => {
            // XXX: This should be already be a number but typescript tells me it is not
            const selectedIndex = data.list[+queueItem.streamingUrlIdx];
            const url = karafriendsConfig.useLowBitrateUrl
              ? selectedIndex.lowBitrateUrl
              : selectedIndex.highBitrateUrl;
            downloadDamVideo(url, queueItem.songId, queueItem.streamingUrlIdx);
          });
      }

      return pushSongToQueue(queueItem);
    },
    queueYoutubeSong: (
      _: any,
      args: { input: QueueYoutubeSongInput }
    ): number => {
      const queueItem: YoutubeQueueItem = {
        timestamp: Date.now().toString(),
        ...args.input,
        hasAdhocLyrics: args.input.adhocSongLyrics ? true : false,
        hasCaptions: args.input.captionCode ? true : false,
        __typename: "YoutubeQueueItem",
      };
      if (args.input.adhocSongLyrics) {
        db.idToAdhocLyrics[args.input.songId] = cleanupAdhocSongLyrics(
          args.input.adhocSongLyrics
        );
      }
      downloadYoutubeVideo(
        args.input.songId,
        args.input.captionCode,
        pushSongToQueue.bind(null, queueItem)
      );
      // The song likely hasn't actually been added to the queue yet since it needs to download,
      // but let's optimistically return the eta assuming it will successfully queue
      return (
        db.songQueue.reduce((acc, cur) => acc + (cur.playtime || 0), 0) +
        (args.input.playtime || 0)
      );
    },
    queueNicoSong: (_: any, args: { input: QueueNicoSongInput }): number => {
      const queueItem: NicoQueueItem = {
        timestamp: Date.now().toString(),
        ...args.input,
        __typename: "NicoQueueItem",
      };
      downloadNicoVideo(
        args.input.songId,
        pushSongToQueue.bind(null, queueItem)
      );
      // The song likely hasn't actually been added to the queue yet since it needs to download,
      // but let's optimistically return the eta assuming it will successfully queue
      return (
        db.songQueue.reduce((acc, cur) => acc + (cur.playtime || 0), 0) +
        (args.input.playtime || 0)
      );
    },
    pushAdhocLyrics: (
      _: any,
      args: { input: PushAdhocLyricsInput }
    ): boolean => {
      db.currentSongAdhocLyrics.push({
        lyric: args.input.lyric,
        lyricIndex: args.input.lyricIndex,
      });
      pubsub.publish(SubscriptionEvent.CurrentSongAdhocLyricsChanged, {
        currentSongAdhocLyricsChanged: db.currentSongAdhocLyrics,
      });
      return true;
    },
    popAdhocLyrics: (_: any, args: {}): boolean => {
      db.currentSongAdhocLyrics.shift();
      pubsub.publish(SubscriptionEvent.CurrentSongAdhocLyricsChanged, {
        currentSongAdhocLyricsChanged: db.currentSongAdhocLyrics,
      });
      return true;
    },
    popSong: (_: any, args: {}): QueueItem | null => {
      pubsub.publish(SubscriptionEvent.QueueChanged, {
        queueChanged: db.songQueue,
      });
      const newSong = db.songQueue.shift() || null;
      db.currentSongAdhocLyrics = [];
      pubsub.publish(SubscriptionEvent.CurrentSongAdhocLyricsChanged, {
        currentSongAdhocLyricsChanged: db.currentSongAdhocLyrics,
      });
      db.currentSong = newSong;
      return newSong;
    },
    removeSong: (
      _: any,
      args: { songId: string; timestamp: string }
    ): boolean => {
      const songIdx = db.songQueue.findIndex(
        (item) =>
          item.songId === args.songId && item.timestamp === args.timestamp
      );
      db.songQueue.splice(songIdx, 1);
      pubsub.publish(SubscriptionEvent.QueueChanged, {
        queueChanged: db.songQueue,
      });
      return true;
    },
    setPlaybackState: (
      _: any,
      args: { playbackState: PlaybackState }
    ): boolean => {
      db.playbackState = args.playbackState;
      pubsub.publish(SubscriptionEvent.PlaybackStateChanged, {
        playbackStateChanged: args.playbackState,
      });
      return true;
    },
  },
  Subscription: {
    playbackStateChanged: {
      subscribe: () =>
        pubsub.asyncIterator([SubscriptionEvent.PlaybackStateChanged]),
    },
    currentSongAdhocLyricsChanged: {
      subscribe: () =>
        pubsub.asyncIterator([SubscriptionEvent.CurrentSongAdhocLyricsChanged]),
    },
    queueChanged: {
      subscribe: () => pubsub.asyncIterator([SubscriptionEvent.QueueChanged]),
    },
    queueAdded: {
      subscribe: () => pubsub.asyncIterator([SubscriptionEvent.QueueAdded]),
    },
  },
};

const schema = makeExecutableSchema({
  typeDefs: rawSchema,
  resolvers,
});

export function applyGraphQLMiddleware(
  app: Application,
  creds: MinseiCredentials
) {
  const server = new ApolloServer({
    dataSources: () => ({
      minsei: new MinseiAPI(creds),
      dkwebsys: new DkwebsysAPI(),
      youtube: new YoutubeAPI(),
    }),
    schema,
    playground: {
      subscriptionEndpoint: "ws://localhost:8080/subscriptions",
    },
  });
  if (isDev) {
    app.use("/graphql", (req, res, next) => {
      res.append("Access-Control-Allow-Origin", "*");
      res.append("Access-Control-Allow-Headers", "*");
      if (req.method === "OPTIONS") {
        res.sendStatus(200);
        return;
      }
      next();
    });
  }
  server.applyMiddleware({ app });
}

export function subscriptionServer(server: Server) {
  return () => {
    return new SubscriptionServer(
      {
        execute,
        subscribe,
        schema,
      },
      {
        server,
        path: "/subscriptions",
      }
    );
  };
}
