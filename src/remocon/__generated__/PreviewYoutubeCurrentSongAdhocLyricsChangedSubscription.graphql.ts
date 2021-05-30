/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from "relay-runtime";
export type PreviewYoutubeCurrentSongAdhocLyricsChangedSubscriptionVariables = {};
export type PreviewYoutubeCurrentSongAdhocLyricsChangedSubscriptionResponse = {
    readonly currentSongAdhocLyricsChanged: ReadonlyArray<string>;
};
export type PreviewYoutubeCurrentSongAdhocLyricsChangedSubscription = {
    readonly response: PreviewYoutubeCurrentSongAdhocLyricsChangedSubscriptionResponse;
    readonly variables: PreviewYoutubeCurrentSongAdhocLyricsChangedSubscriptionVariables;
};



/*
subscription PreviewYoutubeCurrentSongAdhocLyricsChangedSubscription {
  currentSongAdhocLyricsChanged
}
*/

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "currentSongAdhocLyricsChanged",
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "PreviewYoutubeCurrentSongAdhocLyricsChangedSubscription",
    "selections": (v0/*: any*/),
    "type": "Subscription",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "PreviewYoutubeCurrentSongAdhocLyricsChangedSubscription",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "52b11e3e996ad6554c44892ec01dca03",
    "id": null,
    "metadata": {},
    "name": "PreviewYoutubeCurrentSongAdhocLyricsChangedSubscription",
    "operationKind": "subscription",
    "text": "subscription PreviewYoutubeCurrentSongAdhocLyricsChangedSubscription {\n  currentSongAdhocLyricsChanged\n}\n"
  }
};
})();
(node as any).hash = '09682b3af85ef3d0965c0640010c7d88';
export default node;
