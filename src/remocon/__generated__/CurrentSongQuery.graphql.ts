/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from "relay-runtime";
export type CurrentSongQueryVariables = {};
export type CurrentSongQueryResponse = {
    readonly currentSong: {
        readonly __typename?: string;
        readonly id?: string;
        readonly adhocSongLyrics?: ReadonlyArray<string> | null;
    } | null;
};
export type CurrentSongQuery = {
    readonly response: CurrentSongQueryResponse;
    readonly variables: CurrentSongQueryVariables;
};



/*
query CurrentSongQuery {
  currentSong {
    __typename
    ... on YoutubeQueueItem {
      __typename
      id
      adhocSongLyrics
    }
    ... on QueueItemInterface {
      __isQueueItemInterface: __typename
      __typename
      id
    }
  }
}
*/

const node: ConcreteRequest = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "__typename",
  "storageKey": null
},
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "adhocSongLyrics",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "CurrentSongQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": null,
        "kind": "LinkedField",
        "name": "currentSong",
        "plural": false,
        "selections": [
          {
            "kind": "InlineFragment",
            "selections": [
              (v0/*: any*/),
              (v1/*: any*/),
              (v2/*: any*/)
            ],
            "type": "YoutubeQueueItem",
            "abstractKey": null
          },
          {
            "kind": "InlineFragment",
            "selections": [
              (v0/*: any*/),
              (v1/*: any*/)
            ],
            "type": "QueueItemInterface",
            "abstractKey": "__isQueueItemInterface"
          }
        ],
        "storageKey": null
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "CurrentSongQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": null,
        "kind": "LinkedField",
        "name": "currentSong",
        "plural": false,
        "selections": [
          (v0/*: any*/),
          {
            "kind": "InlineFragment",
            "selections": [
              (v1/*: any*/),
              (v2/*: any*/)
            ],
            "type": "YoutubeQueueItem",
            "abstractKey": null
          },
          {
            "kind": "InlineFragment",
            "selections": [
              (v1/*: any*/)
            ],
            "type": "QueueItemInterface",
            "abstractKey": "__isQueueItemInterface"
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "54b917eb086272b4de038b5d219543d2",
    "id": null,
    "metadata": {},
    "name": "CurrentSongQuery",
    "operationKind": "query",
    "text": "query CurrentSongQuery {\n  currentSong {\n    __typename\n    ... on YoutubeQueueItem {\n      __typename\n      id\n      adhocSongLyrics\n    }\n    ... on QueueItemInterface {\n      __isQueueItemInterface: __typename\n      __typename\n      id\n    }\n  }\n}\n"
  }
};
})();
(node as any).hash = '6779c27cc804c61760a0a0ead76e6f71';
export default node;
