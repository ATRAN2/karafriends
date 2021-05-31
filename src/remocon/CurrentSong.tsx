import React, { useEffect, useRef, useState } from "react";
// tslint:disable-next-line:no-submodule-imports
import { FaSadTear } from "react-icons/fa";
import { graphql, useLazyLoadQuery } from "react-relay";
import { withLoader } from "../common/components/Loader";
import PreviewYoutube from "./PreviewYoutube";
import Song from "./Song";
import {
  CurrentSongQuery,
  CurrentSongQueryResponse,
} from "./__generated__/CurrentSongQuery.graphql";

const currentSongQuery = graphql`
  query CurrentSongQuery {
    currentSong {
      ... on YoutubeQueueItem {
        __typename
        id
        adhocSongLyrics
      }
      ... on QueueItemInterface {
        __typename
        id
      }
    }
  }
`;

function CurrentSong() {
  const queryData: CurrentSongQueryResponse = useLazyLoadQuery<CurrentSongQuery>(
    currentSongQuery,
    {}
  );
  // switch (queryData.currentSong?.__typename) {
  //   case "DamQueueItem":
  //     break;
  //   case "YoutubeQueueItem":
  // }
  function getCurrentSongComponent() {
    switch (queryData?.currentSong?.__typename) {
      case "DamQueueItem":
        if (!queryData.currentSong.id) return null;
        return <Song id={queryData.currentSong.id} />;
      case "YoutubeQueueItem":
        if (!queryData.currentSong.id) return null;
        return <PreviewYoutube videoId={queryData.currentSong.id} />;
    }
    return (
      <div style={{ fontSize: "4em" }}>
        No song currenty queued <FaSadTear />
      </div>
    );
  }

  return <>{getCurrentSongComponent()}</>;
}

export default withLoader(CurrentSong);
