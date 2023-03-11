import shared from "./shared.js";

const API_ADDR = "https://api.phi.zone";
const API_PATH = {
  auth: "/auth/token/",
  userDetail: "/user_detail/",
  playChart: "/player/play/",
  record: "/records/",
  configurations: "/player/configurations/",
};

const getApi = (e) => API_ADDR + API_PATH[e];

export default {
  refreshLogin(user, credential, type) {
    return new Promise(async (res, rej) => {
      try {
        var myHeaders = new Headers();
        myHeaders.append("User-Agent", "PhiZoneRegularAccess");
        var formdata = new FormData();
        formdata.append(
          "client_id",
          "zOQaWAHlX0E0Wh8m7gZP6hmmX8Zkfyh4rGmok1Xf"
        );
        formdata.append(
          "client_secret",
          "zHJ6L9HbfUEdFxxlRuO3I1EBQNLtnInLqk9e3pKPqcO4y39L3Rf9S0wLdn355WOx9Qlqtj3JrNYsiCiDRPmwh8hUOW6kpgRlS6tza3XzhNN8w51fgEXZrCrRsqgpcElA"
        );
        formdata.append("grant_type", type);
        formdata.append("username", user);
        formdata.append(type, credential);

        var requestOptions = {
          method: "POST",
          body: formdata,
          headers: myHeaders,
        };

        const response = await fetch(getApi("auth"), requestOptions);
        const result = await response.json();

        if (result.access_token) {
          res(result);
        } else {
          if (result.error_description) rej(result.error_description);
          else rej("未知错误");
        }
      } catch (error) {
        rej("网络连接不畅，请稍后重试");
      }
    });
  },
  getUserBasicInfo(access_token) {
    return new Promise(async (res, rej) => {
      try {
        var myHeaders = new Headers();
        myHeaders.append("User-Agent", "PhiZoneRegularAccess");
        myHeaders.append("Authorization", `Bearer ${access_token}`);

        var requestOptions = {
          method: "GET",
          headers: myHeaders,
        };

        const response = await fetch(getApi("userDetail"), requestOptions);
        const result = await response.json();

        if (result.username) {
          res(result);
        } else {
          if (result.detail) rej(result.detail);
          else rej("未知错误");
        }
      } catch (error) {
        rej("网络连接不畅，请稍后重试");
      }
    });
  },
  getUserConfigurations(access_token) {
    return new Promise(async (res, rej) => {
      try {
        var myHeaders = new Headers();
        myHeaders.append("User-Agent", "PhiZoneRegularAccess");
        myHeaders.append("Authorization", `Bearer ${access_token}`);

        var requestOptions = {
          method: "GET",
          headers: myHeaders,
        };

        const response = await fetch(getApi("configurations"), requestOptions);
        const result = await response.json();

        if (result.results) {
          res(result.results);
        } else {
          rej("未知错误");
        }
      } catch (error) {
        rej("网络连接不畅，请稍后重试");
      }
    });
  },
  getSpecConfiguration(access_token, id) {
    return new Promise(async (res, rej) => {
      try {
        var myHeaders = new Headers();
        myHeaders.append("User-Agent", "PhiZoneRegularAccess");
        myHeaders.append("Authorization", `Bearer ${access_token}`);

        var requestOptions = {
          method: "GET",
          headers: myHeaders,
        };

        const response = await fetch(getApi("configurations")+`${id}/`, requestOptions);
        const result = await response.json();

        if (result) {
          res(result);
        } else {
          rej("未知错误");
        }
      } catch (error) {
        rej("网络连接不畅，请稍后重试");
      }
    });
  },
  patchSpecConfiguration(access_token, id, data) {
    return new Promise(async (res, rej) => {
      try {
        var myHeaders = new Headers();
        myHeaders.append("User-Agent", "PhiZoneRegularAccess");
        myHeaders.append("Authorization", `Bearer ${access_token}`);

        var form = new FormData();

        for(const t in data) {
          form.append(t, data[t]);
        }

        var requestOptions = {
          method: "PATCH",
          body: form,
          headers: myHeaders,
        };

        await fetch(getApi("configurations")+`${id}/`, requestOptions);

	
        const result = await this.getUserConfigurations(access_token);
	      shared.game.ptmain.gameConfig.account.defaultConfigID=result[result.length-1].id;

	      requestOptions.method="DELETE";
        
	fetch(getApi("configurations")+`${id}/`, requestOptions);
        if (result) {
          res(result);
        } else {
          rej("未知错误");
        }
      } catch (error) {
        rej("网络连接不畅，请稍后重试");
      }
    });
  },
  playChartEncrypted(access_token, chart, config) {
    return fetch(`/api/pzEncrypted/play/${chart}/${config}/${access_token}`);
  },
  recordEncrypted(access_token, data) {
    return new Promise((res,rej)=>{
        let myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        let request = new Request(
            `/api/pzEncrypted/record/${access_token}`,
        {
            method: "POST",
            body: JSON.stringify(data),
            headers: myHeaders,
        }
        );
        fetch(request)
            .then(e=>e.json())
            .then((e) => {
                res(e)
            })
            .catch(e=>{
                rej(e)
            })
    })
  },
};
