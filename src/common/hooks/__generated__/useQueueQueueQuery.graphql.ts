/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from "relay-runtime";
export type useQueueQueueQueryVariables = {};
export type useQueueQueueQueryResponse = {
    readonly queue: ReadonlyArray<{
        readonly song: {
            readonly id: string;
            readonly name: string;
            readonly artistName: string;
            readonly playtime: number | null;
        };
        readonly timestamp: string;
    }>;
};
export type useQueueQueueQuery = {
    readonly response: useQueueQueueQueryResponse;
    readonly variables: useQueueQueueQueryVariables;
};



/*
query useQueueQueueQuery {
  queue {
    song {
      id
      name
      artistName
      playtime
    }
    timestamp
  }
}
*/

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "QueueItem",
    "kind": "LinkedField",
    "name": "queue",
    "plural": true,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Song",
        "kind": "LinkedField",
        "name": "song",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "id",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "name",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "artistName",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "playtime",
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "timestamp",
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "useQueueQueueQuery",
    "selections": (v0/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "useQueueQueueQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "3d0f226793d5f91fe17e8aaea9c90b0d",
    "id": null,
    "metadata": {},
    "name": "useQueueQueueQuery",
    "operationKind": "query",
    "text": "query useQueueQueueQuery {\n  queue {\n    song {\n      id\n      name\n      artistName\n      playtime\n    }\n    timestamp\n  }\n}\n"
  }
};
})();
(node as any).hash = '203d2cc24158144101e9b039fa222185';
export default node;
