import fetch from "node-fetch";

const BASE_DK_DENMOKU_REQUEST = {
  appVer: "2.1.0",
  deviceId: "deviceId",
};

interface DkdenmokuResponse {
  // There are literally no useful fields
  appVer: string;
}

function makeDkdenmokuRequest<T extends DkdenmokuResponse>(
  url: string,
  data: any
) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...BASE_DK_DENMOKU_REQUEST,
      ...data,
    }),
  })
    .then((res) => res.json())
    .then((json: T) => json);
}

const BASE_DKWEBSYS_REQUEST = {
  modelTypeCode: "2",
  minseiModelNum: "M1",
  compId: "1",
  authKey: "2/Qb9R@8s*",
};

interface DkwebsysReponse {
  result: {
    statusCode: string;
    message: string;
    detailMessage?: string;
  };
}

function makeDkwebsysRequest<T extends DkwebsysReponse>(
  url: string,
  data: any
) {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...BASE_DKWEBSYS_REQUEST,
      ...data,
    }),
  })
    .then((res) => {
      return res.json();
    })
    .then((json: T) => {
      if (json.result.statusCode !== "0000") {
        throw new Error(`${json.result.message}: ${json.result.detailMessage}`);
      }
      return json;
    });
}

interface SearchMusicByKeywordResponse extends DkwebsysReponse {
  list: {
    requestNo: string;
    title: string;
    artist: string;
  }[];
}

function searchMusicByKeyword(keyword: string) {
  return makeDkwebsysRequest<SearchMusicByKeywordResponse>(
    "https://csgw.clubdam.com/dkwebsys/search-api/SearchMusicByKeywordApi",
    {
      keyword,
      sort: "1",
      pageNo: "1",
      dispCount: "30",
    }
  );
}

interface DkDamIsExistServletResponse extends DkdenmokuResponse {
  isExist: {
    artistName: string;
    firstBars: string;
    reqNo: string;
    songName: string;
  }[];
}

function dkDamIsExistServlet(reqNos: string[]) {
  return makeDkdenmokuRequest<DkDamIsExistServletResponse>(
    "https://denmoku.clubdam.com/dkdenmoku/DkDamIsExistServlet",
    {
      isExist: reqNos.map((reqNo) => ({
        reqNo: reqNo.replace("-", ""),
      })),
    }
  );
}

export { dkDamIsExistServlet, searchMusicByKeyword };