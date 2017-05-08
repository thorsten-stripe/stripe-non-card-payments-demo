(function(Stripe){
  // extend with source create function
  Stripe.source.create = function(params, callback){
    ajax.post(
      Stripe.endpoint+'/sources',
      params,
      Stripe.key,
      callback
    )
  }

  // Helpers
  var ajax = {};
  ajax.x = function () {
      if (typeof XMLHttpRequest !== 'undefined') {
          return new XMLHttpRequest();
      }
      var versions = [
          "MSXML2.XmlHttp.6.0",
          "MSXML2.XmlHttp.5.0",
          "MSXML2.XmlHttp.4.0",
          "MSXML2.XmlHttp.3.0",
          "MSXML2.XmlHttp.2.0",
          "Microsoft.XmlHttp"
      ];

      var xhr;
      for (var i = 0; i < versions.length; i++) {
          try {
              xhr = new ActiveXObject(versions[i]);
              break;
          } catch (e) {
          }
      }
      return xhr;
  };

  ajax.send = function (url, callback, method, data, apiKey, async) {
      if (async === undefined) {
          async = true;
      }
      var x = ajax.x();
      x.open(method, url, async);
      x.setRequestHeader('Authorization', 'Bearer '+ apiKey);
      x.onreadystatechange = function () {
          if (x.readyState == 4) {
              callback(x.status, JSON.parse(x.responseText))
          }
      };
      if (method == 'POST') {
          x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      }
      x.send(data)
  };

  ajax.get = function (url, data, apiKey, callback, async) {
      var query = [];
      for (var key in data) {
          query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
      }
      ajax.send(url + (query.length ? '?' + query.join('&') : ''), callback, 'GET', null, apiKey, async)
  };

  ajax.post = function (url, data, apiKey, callback, async) {
      ajax.send(url, callback, 'POST', UrlEncoder.encode(data), apiKey, async)
  };

  UrlEncoder = {

    /**
    * Encode a [deeply] nested object for use in a url
    * Assumes Array.each is defined
    */
    encode: function(params, prefix) {

      var items = [];

      for(var field in params) {

        var key  = prefix ? prefix + "[" + field + "]" : field;
        var type = typeof params[field];

        switch(type) {

          case "object":

            //handle arrays appropriately x[]=1&x[]=3
            if(params[field].constructor == Array) {
              params[field].each(function(val) {
                items.push(key + "[]=" + val);
              }, this);
            } else {
              //recusrively construct the sub-object
              items = items.concat(this.encode(params[field], key));
            }
            break;
          case "function":
            break;
          default:
            items.push(key + "=" + escape(params[field]));
            break;
        }
      }

      return items.join("&");
    },

    /**
    * Decode a deeply nested Url
    */
    decode: function(params) {

      var obj	  = {};
      var parts = params.split("&");

      parts.each(function(kvs) {

        var kvp = kvs.split("=");
        var key = kvp[0];
        var val = unescape(kvp[1]);

        if(/\[\w+\]/.test(key)) {

          var rgx = /\[(\w+)\]/g;
          var top = /^([^\[]+)/.exec(key)[0];
          var sub = rgx.exec(key);

          if(!obj[top]) {
            obj[top] = {};
          }

          var unroot = function(o) {

            if(sub == null) {
              return;
            }

            var sub_key = sub[1];

            sub = rgx.exec(key);

            if(!o[sub_key]) {
              o[sub_key] = sub ? {} : val;
            }

            unroot(o[sub_key]);
          };


          unroot(obj[top]);

        //array
        } else if(/\[\]$/.test(key)) {
          key = /(^\w+)/.exec(key)[0];
          if(!obj[key]) {
            obj[key] = [];
          }
          obj[key].push(val);
        } else {
          obj[key] = val;
        }

      });

      return obj;
    }

  };
})(Stripe)
