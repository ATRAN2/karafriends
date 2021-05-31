import React, { useEffect, useRef, useState } from "react";
import { graphql, requestSubscription, useLazyLoadQuery } from "react-relay";
import YoutubePlayer from "youtube-player";
import { withLoader } from "../common/components/Loader";
import YoutubeQueueButton from "./components/YoutubeQueueButton";
import {
  PreviewYoutubeVideoInfoQuery,
  PreviewYoutubeVideoInfoQueryResponse,
} from "./__generated__/PreviewYoutubeVideoInfoQuery.graphql";

import "./PreviewYoutube.css";

import environment from "../common/graphqlEnvironment";
import AdhocLyrics from "./../renderer/AdHocLyrics";
import { PreviewYoutubeCurrentSongAdhocLyricsChangedSubscription } from "./__generated__/PreviewYoutubeCurrentSongAdhocLyricsChangedSubscription.graphql";

const previewYoutubeVideoInfoQuery = graphql`
  query PreviewYoutubeVideoInfoQuery($videoId: String!) {
    youtubeVideoInfo(videoId: $videoId) {
      ... on YoutubeVideoInfo {
        __typename
        author
        channelId
        keywords
        lengthSeconds
        description
        title
        viewCount
      }
      ... on YoutubeVideoInfoError {
        __typename
        reason
      }
    }
  }
`;

const previewYoutubeCurrentSongAdhocLyricsChangedSubscription = graphql`
  subscription PreviewYoutubeCurrentSongAdhocLyricsChangedSubscription {
    currentSongAdhocLyricsChanged
  }
`;

type PreviewYoutubeProps = {
  videoId: string;
};

function PreviewYoutube(props: PreviewYoutubeProps) {
  const playerRef: React.MutableRefObject<ReturnType<
    typeof YoutubePlayer
  > | null> = useRef(null);
  const { videoId } = props;
  const [adhocSongLyrics, setAdhocSongLyrics] = useState<string | null>(null);
  const videoData = useLazyLoadQuery<PreviewYoutubeVideoInfoQuery>(
    previewYoutubeVideoInfoQuery,
    { videoId }
  );

  const [lyrics, setLyrics] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const subscription = requestSubscription<PreviewYoutubeCurrentSongAdhocLyricsChangedSubscription>(
      environment,
      {
        subscription: previewYoutubeCurrentSongAdhocLyricsChangedSubscription,
        variables: {},
        onNext: (response) => {
          if (response?.currentSongAdhocLyricsChanged) {
            setLyrics([...response.currentSongAdhocLyricsChanged]);
          }
        },
      }
    );
    // @ts-ignore
    window.videoRef = videoRef;
  }, []);

  useEffect(() => {
    if (playerRef.current == null) {
      playerRef.current = YoutubePlayer("youtube-player", { videoId });
    } else {
      playerRef.current.loadVideoById(videoId);
      playerRef.current.stopVideo();
    }
  }, [props.videoId]);

  function onAdhocSongLyricsChanged(
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) {
    const input = event.target.value;
    setAdhocSongLyrics(input && input.trim() !== "" ? input : null);
  }

  function displayVideoInfo(videoInfo: PreviewYoutubeVideoInfoQueryResponse) {
    switch (videoData.youtubeVideoInfo.__typename) {
      case "YoutubeVideoInfo":
        return (
          <div className="flex-container flex-vertical">
            <div className="flex-item">
              <span className="channel-name">
                {videoData.youtubeVideoInfo.author}
              </span>
            </div>
            <div className="flex-item">{videoData.youtubeVideoInfo.title}</div>
            <div className="flex-item">
              View Count: {videoData.youtubeVideoInfo.viewCount} | Video Length:{" "}
              {videoData.youtubeVideoInfo.lengthSeconds}
            </div>
            <div className="flex-item">
              <YoutubeQueueButton
                defaultText={"Queue Song"}
                variables={{
                  input: {
                    id: videoId,
                    name: videoData.youtubeVideoInfo.title,
                    artistName: videoData.youtubeVideoInfo.author,
                    playtime: videoData.youtubeVideoInfo.lengthSeconds,
                    adhocSongLyrics,
                  },
                }}
              />
            </div>
            <div className="flex-item">
              <textarea
                onChange={onAdhocSongLyricsChanged}
                placeholder={
                  "Paste adhoc song lyrics here. Lyrics can be added line by line onto the screen while the song is playing"
                }
              />
            </div>
            <div className="vid-container">
              <video src="static/u0CqY27IFyo.mp4" ref={videoRef} controls />
              <AdhocLyrics
                videoRef={videoRef}
                lyrics={["か弱い光が指差す先", "Silent haze 霞がちに止まる影"]}
              />
            </div>
          </div>
        );
      case "YoutubeVideoInfoError":
        return (
          <div className="flex-item">
            Unable to get video info for the following reason:{" "}
            {videoData.youtubeVideoInfo.reason}
          </div>
        );
    }
  }

  return (
    <div className="flex-container">
      <div className="responsive-player-width">
        <div id="youtube-player" className="flex-item" />
      </div>
      {displayVideoInfo(videoData)}
    </div>
  );
}

export default withLoader(PreviewYoutube);
