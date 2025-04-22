(function () {
    window.pedalsUp = {
      connect: () => {
        return new Promise((resolve) => {
          window.postMessage({ type: "PEDALS_UP_CONNECT" }, "*");
  
          window.addEventListener("message", function handler(event) {
            if (event.data.type === "PEDALS_UP_CONNECTED") {
              window.removeEventListener("message", handler);
              resolve(event.data.address);
            }
          });
        });
      },
  
      getAccounts: () => {
        return new Promise((resolve) => {
          window.postMessage({ type: "PEDALS_UP_GET_ACCOUNTS" }, "*");
  
          window.addEventListener("message", function handler(event) {
            if (event.data.type === "PEDALS_UP_ACCOUNTS") {
              window.removeEventListener("message", handler);
              resolve(event.data.accounts);
            }
          });
        });
      },
  
      signTransaction: (tx) => {
        return new Promise((resolve) => {
          window.postMessage({ type: "PEDALS_UP_SIGN", tx }, "*");
  
          window.addEventListener("message", function handler(event) {
            if (event.data.type === "PEDALS_UP_SIGNED") {
              window.removeEventListener("message", handler);
              resolve(event.data.signature);
            }
          });
        });
      },
    };
  })();
  