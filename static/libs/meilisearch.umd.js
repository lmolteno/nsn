(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('cross-fetch/polyfill')) :
    typeof define === 'function' && define.amd ? define(['exports', 'cross-fetch/polyfill'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.window = global.window || {}));
}(this, (function (exports) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

    var MeiliSearchError =
    /** @class */
    function (_super) {
      __extends(MeiliSearchError, _super);

      function MeiliSearchError(message) {
        var _this = _super.call(this, message) || this;

        _this.name = 'MeiliSearchError';
        _this.type = 'MeiliSearchError';

        if (Error.captureStackTrace) {
          Error.captureStackTrace(_this, MeiliSearchError);
        }

        return _this;
      }

      return MeiliSearchError;
    }(Error);

    var MeiliSearchTimeOutError =
    /** @class */
    function (_super) {
      __extends(MeiliSearchTimeOutError, _super);

      function MeiliSearchTimeOutError(message) {
        var _this = _super.call(this, message) || this;

        _this.name = 'MeiliSearchTimeOutError';
        _this.type = _this.constructor.name;

        if (Error.captureStackTrace) {
          Error.captureStackTrace(_this, MeiliSearchTimeOutError);
        }

        return _this;
      }

      return MeiliSearchTimeOutError;
    }(Error);

    /**
     * Removes undefined entries from object
     */

    function removeUndefinedFromObject(obj) {
      return Object.entries(obj).reduce(function (acc, curEntry) {
        var key = curEntry[0],
            val = curEntry[1];
        if (val !== undefined) acc[key] = val;
        return acc;
      }, {});
    }

    function sleep(ms) {
      return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [4
              /*yield*/
              , new Promise(function (resolve) {
                return setTimeout(resolve, ms);
              })];

            case 1:
              return [2
              /*return*/
              , _a.sent()];
          }
        });
      });
    }

    var MeiliSearchCommunicationError =
    /** @class */
    function (_super) {
      __extends(MeiliSearchCommunicationError, _super);

      function MeiliSearchCommunicationError(message, body) {
        var _this = _super.call(this, message) || this;

        _this.name = 'MeiliSearchCommunicationError';
        _this.type = 'MeiliSearchCommunicationError';

        if (body instanceof Response) {
          _this.message = body.statusText;
          _this.statusCode = body.status;
        }

        if (body instanceof Error) {
          _this.errno = body.errno;
          _this.code = body.code;
        }

        if (Error.captureStackTrace) {
          Error.captureStackTrace(_this, MeiliSearchCommunicationError);
        }

        return _this;
      }

      return MeiliSearchCommunicationError;
    }(Error);

    var MeiliSearchApiError =
    /** @class */
    function (_super) {
      __extends(class_1, _super);

      function class_1(error, status) {
        var _this = _super.call(this, error.message) || this;

        _this.type = 'MeiliSearchApiError';
        _this.name = 'MeiliSearchApiError';
        _this.errorCode = error.errorCode;
        _this.errorType = error.errorType;
        _this.errorLink = error.errorLink;
        _this.message = error.message;
        _this.httpStatus = status;

        if (Error.captureStackTrace) {
          Error.captureStackTrace(_this, MeiliSearchApiError);
        }

        return _this;
      }

      return class_1;
    }(Error);

    function httpResponseErrorHandler(response) {
      return __awaiter(this, void 0, void 0, function () {
        var err;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              if (!!response.ok) return [3
              /*break*/
              , 5];
              err = void 0;
              _a.label = 1;

            case 1:
              _a.trys.push([1, 3,, 4]);

              return [4
              /*yield*/
              , response.json()];

            case 2:
              err = _a.sent();
              return [3
              /*break*/
              , 4];

            case 3:
              _a.sent();
              throw new MeiliSearchCommunicationError(response.statusText, response);

            case 4:
              throw new MeiliSearchApiError(err, response.status);

            case 5:
              return [2
              /*return*/
              , response];
          }
        });
      });
    }

    function httpErrorHandler(response) {
      if (response.type !== 'MeiliSearchApiError') {
        throw new MeiliSearchCommunicationError(response.message, response);
      }

      throw response;
    }

    var HttpRequests =
    /** @class */
    function () {
      function HttpRequests(config) {
        this.headers = __assign(__assign(__assign({}, config.headers || {}), {
          'Content-Type': 'application/json'
        }), config.apiKey ? {
          'X-Meili-API-Key': config.apiKey
        } : {});
        this.url = new URL(config.host);
      }

      HttpRequests.addTrailingSlash = function (url) {
        if (!url.endsWith('/')) {
          url += '/';
        }

        return url;
      };

      HttpRequests.prototype.request = function (_a) {
        var method = _a.method,
            url = _a.url,
            params = _a.params,
            body = _a.body,
            config = _a.config;
        return __awaiter(this, void 0, void 0, function () {
          var constructURL, queryParams_1, response, parsedBody, parsedJson, e_1;
          return __generator(this, function (_b) {
            switch (_b.label) {
              case 0:
                _b.trys.push([0, 3,, 4]);

                constructURL = new URL(url, this.url);

                if (params) {
                  queryParams_1 = new URLSearchParams();
                  Object.keys(params).filter(function (x) {
                    return params[x] !== null;
                  }).map(function (x) {
                    return queryParams_1.set(x, params[x]);
                  });
                  constructURL.search = queryParams_1.toString();
                }

                return [4
                /*yield*/
                , fetch(constructURL.toString(), __assign(__assign({}, config), {
                  method: method,
                  body: body ? JSON.stringify(body) : undefined,
                  headers: this.headers
                })).then(function (res) {
                  return httpResponseErrorHandler(res);
                })];

              case 1:
                response = _b.sent();
                return [4
                /*yield*/
                , response.text()];

              case 2:
                parsedBody = _b.sent();

                try {
                  parsedJson = JSON.parse(parsedBody);
                  return [2
                  /*return*/
                  , parsedJson];
                } catch (_) {
                  return [2
                  /*return*/
                  ];
                }

                return [3
                /*break*/
                , 4];

              case 3:
                e_1 = _b.sent();
                httpErrorHandler(e_1);
                return [3
                /*break*/
                , 4];

              case 4:
                return [2
                /*return*/
                ];
            }
          });
        });
      };

      HttpRequests.prototype.get = function (url, params, config) {
        return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                return [4
                /*yield*/
                , this.request({
                  method: 'GET',
                  url: url,
                  params: params,
                  config: config
                })];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };

      HttpRequests.prototype.post = function (url, data, params, config) {
        return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                return [4
                /*yield*/
                , this.request({
                  method: 'POST',
                  url: url,
                  body: data,
                  params: params,
                  config: config
                })];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };

      HttpRequests.prototype.put = function (url, data, params, config) {
        return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                return [4
                /*yield*/
                , this.request({
                  method: 'PUT',
                  url: url,
                  body: data,
                  params: params,
                  config: config
                })];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };

      HttpRequests.prototype["delete"] = function (url, data, params, config) {
        return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                return [4
                /*yield*/
                , this.request({
                  method: 'DELETE',
                  url: url,
                  body: data,
                  params: params,
                  config: config
                })];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };

      return HttpRequests;
    }();

    /*
     * Bundle: MeiliSearch / Indexes
     * Project: MeiliSearch - Javascript API
     * Author: Quentin de Quelen <quentin@meilisearch.com>
     * Copyright: 2019, MeiliSearch
     */

    var Index =
    /** @class */
    function () {
      function Index(config, uid, primaryKey) {
        this.uid = uid;
        this.primaryKey = primaryKey;
        this.httpRequest = new HttpRequests(config);
      } ///
      /// STATIC
      ///


      Index.getApiRoutes = function () {
        return Index.apiRoutes;
      };

      Index.getRouteConstructors = function () {
        return Index.routeConstructors;
      }; ///
      /// UPDATES
      ///

      /**
       * Get the informations about an update status
       * @memberof Index
       * @method getUpdateStatus
       */


      Index.prototype.getUpdateStatus = function (updateId) {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.getUpdateStatus(this.uid, updateId);
                return [4
                /*yield*/
                , this.httpRequest.get(url)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };

      Index.prototype.waitForPendingUpdate = function (updateId, _a) {
        var _b = _a === void 0 ? {} : _a,
            _c = _b.timeOutMs,
            timeOutMs = _c === void 0 ? 5000 : _c,
            _d = _b.intervalMs,
            intervalMs = _d === void 0 ? 50 : _d;

        return __awaiter(this, void 0, void 0, function () {
          var startingTime, response;
          return __generator(this, function (_e) {
            switch (_e.label) {
              case 0:
                startingTime = Date.now();
                _e.label = 1;

              case 1:
                if (!(Date.now() - startingTime < timeOutMs)) return [3
                /*break*/
                , 4];
                return [4
                /*yield*/
                , this.getUpdateStatus(updateId)];

              case 2:
                response = _e.sent();
                if (response.status !== 'enqueued') return [2
                /*return*/
                , response];
                return [4
                /*yield*/
                , sleep(intervalMs)];

              case 3:
                _e.sent();

                return [3
                /*break*/
                , 1];

              case 4:
                throw new MeiliSearchTimeOutError("timeout of " + timeOutMs + "ms has exceeded on process " + updateId + " when waiting for pending update to resolve.");
            }
          });
        });
      };
      /**
       * Get the list of all updates
       * @memberof Index
       * @method getAllUpdateStatus
       */


      Index.prototype.getAllUpdateStatus = function () {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.getAllUpdateStatus(this.uid);
                return [4
                /*yield*/
                , this.httpRequest.get(url)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      }; ///
      /// SEARCH
      ///

      /**
       * Search for documents into an index
       * @memberof Index
       * @method search
       */


      Index.prototype.search = function (query, options, method, config) {
        if (method === void 0) {
          method = 'POST';
        }

        return __awaiter(this, void 0, void 0, function () {
          var url, params, getParams;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.search(this.uid);
                params = {
                  q: query,
                  offset: options === null || options === void 0 ? void 0 : options.offset,
                  limit: options === null || options === void 0 ? void 0 : options.limit,
                  cropLength: options === null || options === void 0 ? void 0 : options.cropLength,
                  filters: options === null || options === void 0 ? void 0 : options.filters,
                  matches: options === null || options === void 0 ? void 0 : options.matches,
                  facetFilters: options === null || options === void 0 ? void 0 : options.facetFilters,
                  facetsDistribution: options === null || options === void 0 ? void 0 : options.facetsDistribution,
                  attributesToRetrieve: options === null || options === void 0 ? void 0 : options.attributesToRetrieve,
                  attributesToCrop: options === null || options === void 0 ? void 0 : options.attributesToCrop,
                  attributesToHighlight: options === null || options === void 0 ? void 0 : options.attributesToHighlight
                };
                if (!(method.toUpperCase() === 'POST')) return [3
                /*break*/
                , 2];
                return [4
                /*yield*/
                , this.httpRequest.post(url, removeUndefinedFromObject(params), undefined, config)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];

              case 2:
                if (!(method.toUpperCase() === 'GET')) return [3
                /*break*/
                , 4];
                getParams = __assign(__assign({}, params), {
                  facetFilters: Array.isArray(options === null || options === void 0 ? void 0 : options.facetFilters) && (options === null || options === void 0 ? void 0 : options.facetFilters) ? JSON.stringify(options.facetFilters) : undefined,
                  facetsDistribution: (options === null || options === void 0 ? void 0 : options.facetsDistribution) ? JSON.stringify(options.facetsDistribution) : undefined,
                  attributesToRetrieve: (options === null || options === void 0 ? void 0 : options.attributesToRetrieve) ? options.attributesToRetrieve.join(',') : undefined,
                  attributesToCrop: (options === null || options === void 0 ? void 0 : options.attributesToCrop) ? options.attributesToCrop.join(',') : undefined,
                  attributesToHighlight: (options === null || options === void 0 ? void 0 : options.attributesToHighlight) ? options.attributesToHighlight.join(',') : undefined
                });
                return [4
                /*yield*/
                , this.httpRequest.get(url, removeUndefinedFromObject(getParams), config)];

              case 3:
                return [2
                /*return*/
                , _a.sent()];

              case 4:
                throw new MeiliSearchError('method parameter should be either POST or GET');
            }
          });
        });
      }; ///
      /// INDEX
      ///

      /**
       * Get index information.
       * @memberof Index
       * @method getRawInfo
       */


      Index.prototype.getRawInfo = function () {
        return __awaiter(this, void 0, void 0, function () {
          var url, res;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.indexRoute(this.uid);
                return [4
                /*yield*/
                , this.httpRequest.get(url)];

              case 1:
                res = _a.sent();
                this.primaryKey = res.primaryKey;
                return [2
                /*return*/
                , res];
            }
          });
        });
      };
      /**
       * Fetch and update Index information.
       * @memberof Index
       * @method fetchInfo
       */


      Index.prototype.fetchInfo = function () {
        return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                return [4
                /*yield*/
                , this.getRawInfo()];

              case 1:
                _a.sent();

                return [2
                /*return*/
                , this];
            }
          });
        });
      };
      /**
       * Get Primary Key.
       * @memberof Index
       * @method fetchPrimaryKey
       */


      Index.prototype.fetchPrimaryKey = function () {
        return __awaiter(this, void 0, void 0, function () {
          var _a;

          return __generator(this, function (_b) {
            switch (_b.label) {
              case 0:
                _a = this;
                return [4
                /*yield*/
                , this.getRawInfo()];

              case 1:
                _a.primaryKey = _b.sent().primaryKey;
                return [2
                /*return*/
                , this.primaryKey];
            }
          });
        });
      };
      /**
       * Create an index.
       * @memberof Index
       * @method create
       */


      Index.create = function (config, uid, options) {
        if (options === void 0) {
          options = {};
        }

        return __awaiter(this, void 0, void 0, function () {
          var url, req, index;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.apiRoutes.indexes;
                req = new HttpRequests(config);
                return [4
                /*yield*/
                , req.post(url, __assign(__assign({}, options), {
                  uid: uid
                }))];

              case 1:
                index = _a.sent();
                return [2
                /*return*/
                , new Index(config, uid, index.primaryKey)];
            }
          });
        });
      };
      /**
       * Update an index.
       * @memberof Index
       * @method update
       */


      Index.prototype.update = function (data) {
        return __awaiter(this, void 0, void 0, function () {
          var url, index;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.update(this.uid);
                return [4
                /*yield*/
                , this.httpRequest.put(url, data)];

              case 1:
                index = _a.sent();
                this.primaryKey = index.primaryKey;
                return [2
                /*return*/
                , this];
            }
          });
        });
      };
      /**
       * Delete an index.
       * @memberof Index
       * @method delete
       */


      Index.prototype["delete"] = function () {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors["delete"](this.uid);
                return [4
                /*yield*/
                , this.httpRequest["delete"](url)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      }; ///
      /// STATS
      ///

      /**
       * get stats of an index
       * @memberof Index
       * @method getStats
       */


      Index.prototype.getStats = function () {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = "/indexes/" + this.uid + "/stats";
                return [4
                /*yield*/
                , this.httpRequest.get(url)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      }; ///
      /// DOCUMENTS
      ///

      /**
       * get documents of an index
       * @memberof Index
       * @method getDocuments
       */


      Index.prototype.getDocuments = function (options) {
        return __awaiter(this, void 0, void 0, function () {
          var url, attr;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.getDocuments(this.uid);

                if (options !== undefined && Array.isArray(options.attributesToRetrieve)) {
                  attr = options.attributesToRetrieve.join(',');
                }

                return [4
                /*yield*/
                , this.httpRequest.get(url, __assign(__assign({}, options), attr !== undefined ? {
                  attributesToRetrieve: attr
                } : {}))];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };
      /**
       * Get one document
       * @memberof Index
       * @method getDocument
       */


      Index.prototype.getDocument = function (documentId) {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.getDocument(this.uid, documentId);
                return [4
                /*yield*/
                , this.httpRequest.get(url)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };
      /**
       * Add or replace multiples documents to an index
       * @memberof Index
       * @method addDocuments
       */


      Index.prototype.addDocuments = function (documents, options) {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.addDocuments(this.uid);
                return [4
                /*yield*/
                , this.httpRequest.post(url, documents, options)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };
      /**
       * Add or update multiples documents to an index
       * @memberof Index
       * @method updateDocuments
       */


      Index.prototype.updateDocuments = function (documents, options) {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.updateDocuments(this.uid);
                return [4
                /*yield*/
                , this.httpRequest.put(url, documents, options)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };
      /**
       * Delete one document
       * @memberof Index
       * @method deleteDocument
       */


      Index.prototype.deleteDocument = function (documentId) {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.deleteDocument(this.uid, documentId);
                return [4
                /*yield*/
                , this.httpRequest["delete"](url)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };
      /**
       * Delete multiples documents of an index
       * @memberof Index
       * @method deleteDocuments
       */


      Index.prototype.deleteDocuments = function (documentsIds) {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.deleteDocuments(this.uid);
                return [4
                /*yield*/
                , this.httpRequest.post(url, documentsIds)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };
      /**
       * Delete all documents of an index
       * @memberof Index
       * @method deleteAllDocuments
       */


      Index.prototype.deleteAllDocuments = function () {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.deleteAllDocuments(this.uid);
                return [4
                /*yield*/
                , this.httpRequest["delete"](url)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      }; ///
      /// SETTINGS
      ///

      /**
       * Retrieve all settings
       * @memberof Index
       * @method getSettings
       */


      Index.prototype.getSettings = function () {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.getSettings(this.uid);
                return [4
                /*yield*/
                , this.httpRequest.get(url)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };
      /**
       * Update all settings
       * Any parameters not provided will be left unchanged.
       * @memberof Index
       * @method updateSettings
       */


      Index.prototype.updateSettings = function (settings) {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.updateSettings(this.uid);
                return [4
                /*yield*/
                , this.httpRequest.post(url, settings)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };
      /**
       * Reset settings.
       * @memberof Index
       * @method resetSettings
       */


      Index.prototype.resetSettings = function () {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.resetSettings(this.uid);
                return [4
                /*yield*/
                , this.httpRequest["delete"](url)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      }; ///
      /// SYNONYMS
      ///

      /**
       * Get the list of all synonyms
       * @memberof Index
       * @method getSynonyms
       */


      Index.prototype.getSynonyms = function () {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.getSynonyms(this.uid);
                return [4
                /*yield*/
                , this.httpRequest.get(url)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };
      /**
       * Update the list of synonyms. Overwrite the old list.
       * @memberof Index
       * @method updateSynonyms
       */


      Index.prototype.updateSynonyms = function (synonyms) {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.updateSynonyms(this.uid);
                return [4
                /*yield*/
                , this.httpRequest.post(url, synonyms)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };
      /**
       * Reset the synonym list to be empty again
       * @memberof Index
       * @method resetSynonyms
       */


      Index.prototype.resetSynonyms = function () {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.resetSynonyms(this.uid);
                return [4
                /*yield*/
                , this.httpRequest["delete"](url)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      }; ///
      /// STOP WORDS
      ///

      /**
       * Get the list of all stop-words
       * @memberof Index
       * @method getStopWords
       */


      Index.prototype.getStopWords = function () {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.getStopWords(this.uid);
                return [4
                /*yield*/
                , this.httpRequest.get(url)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };
      /**
       * Update the list of stop-words. Overwrite the old list.
       * @memberof Index
       * @method updateStopWords
       */


      Index.prototype.updateStopWords = function (stopWords) {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.updateStopWords(this.uid);
                return [4
                /*yield*/
                , this.httpRequest.post(url, stopWords)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };
      /**
       * Reset the stop-words list to be empty again
       * @memberof Index
       * @method resetStopWords
       */


      Index.prototype.resetStopWords = function () {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.resetStopWords(this.uid);
                return [4
                /*yield*/
                , this.httpRequest["delete"](url)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      }; ///
      /// RANKING RULES
      ///

      /**
       * Get the list of all ranking-rules
       * @memberof Index
       * @method getRankingRules
       */


      Index.prototype.getRankingRules = function () {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.getRankingRules(this.uid);
                return [4
                /*yield*/
                , this.httpRequest.get(url)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };
      /**
       * Update the list of ranking-rules. Overwrite the old list.
       * @memberof Index
       * @method updateRankingRules
       */


      Index.prototype.updateRankingRules = function (rankingRules) {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.updateRankingRules(this.uid);
                return [4
                /*yield*/
                , this.httpRequest.post(url, rankingRules)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };
      /**
       * Reset the ranking rules list to its default value
       * @memberof Index
       * @method resetRankingRules
       */


      Index.prototype.resetRankingRules = function () {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.resetRankingRules(this.uid);
                return [4
                /*yield*/
                , this.httpRequest["delete"](url)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      }; ///
      /// DISTINCT ATTRIBUTE
      ///

      /**
       * Get the distinct-attribute
       * @memberof Index
       * @method getDistinctAttribute
       */


      Index.prototype.getDistinctAttribute = function () {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.getDistinctAttribute(this.uid);
                return [4
                /*yield*/
                , this.httpRequest.get(url)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };
      /**
       * Update the distinct-attribute.
       * @memberof Index
       * @method updateDistinctAttribute
       */


      Index.prototype.updateDistinctAttribute = function (distinctAttribute) {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.updateDistinctAttribute(this.uid);
                return [4
                /*yield*/
                , this.httpRequest.post(url, distinctAttribute)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };
      /**
       * Reset the distinct-attribute.
       * @memberof Index
       * @method resetDistinctAttribute
       */


      Index.prototype.resetDistinctAttribute = function () {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.resetDistinctAttribute(this.uid);
                return [4
                /*yield*/
                , this.httpRequest["delete"](url)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      }; ///
      /// ATTRIBUTES FOR FACETING
      ///

      /**
       * Get the attributes-for-faceting
       * @memberof Index
       * @method getAttributesForFaceting
       */


      Index.prototype.getAttributesForFaceting = function () {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.getAttributesForFaceting(this.uid);
                return [4
                /*yield*/
                , this.httpRequest.get(url)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };
      /**
       * Update the attributes-for-faceting.
       * @memberof Index
       * @method updateAttributesForFaceting
       */


      Index.prototype.updateAttributesForFaceting = function (attributesForFaceting) {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.updateAttributesForFaceting(this.uid);
                return [4
                /*yield*/
                , this.httpRequest.post(url, attributesForFaceting)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };
      /**
       * Reset the attributes-for-faceting.
       * @memberof Index
       * @method resetAttributesForFaceting
       */


      Index.prototype.resetAttributesForFaceting = function () {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.resetAttributesForFaceting(this.uid);
                return [4
                /*yield*/
                , this.httpRequest["delete"](url)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      }; ///
      /// SEARCHABLE ATTRIBUTE
      ///

      /**
       * Get the searchable-attributes
       * @memberof Index
       * @method getSearchableAttributes
       */


      Index.prototype.getSearchableAttributes = function () {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.getSearchableAttributes(this.uid);
                return [4
                /*yield*/
                , this.httpRequest.get(url)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };
      /**
       * Update the searchable-attributes.
       * @memberof Index
       * @method updateSearchableAttributes
       */


      Index.prototype.updateSearchableAttributes = function (searchableAttributes) {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.updateSearchableAttributes(this.uid);
                return [4
                /*yield*/
                , this.httpRequest.post(url, searchableAttributes)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };
      /**
       * Reset the searchable-attributes.
       * @memberof Index
       * @method resetSearchableAttributes
       */


      Index.prototype.resetSearchableAttributes = function () {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.resetSearchableAttributes(this.uid);
                return [4
                /*yield*/
                , this.httpRequest["delete"](url)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      }; ///
      /// DISPLAYED ATTRIBUTE
      ///

      /**
       * Get the displayed-attributes
       * @memberof Index
       * @method getDisplayedAttributes
       */


      Index.prototype.getDisplayedAttributes = function () {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.getDisplayedAttributes(this.uid);
                return [4
                /*yield*/
                , this.httpRequest.get(url)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };
      /**
       * Update the displayed-attributes.
       * @memberof Index
       * @method updateDisplayedAttributes
       */


      Index.prototype.updateDisplayedAttributes = function (displayedAttributes) {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.updateDisplayedAttributes(this.uid);
                return [4
                /*yield*/
                , this.httpRequest.post(url, displayedAttributes)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };
      /**
       * Reset the displayed-attributes.
       * @memberof Index
       * @method resetDisplayedAttributes
       */


      Index.prototype.resetDisplayedAttributes = function () {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = Index.routeConstructors.resetDisplayedAttributes(this.uid);
                return [4
                /*yield*/
                , this.httpRequest["delete"](url)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };

      Index.apiRoutes = {
        indexes: 'indexes'
      };
      Index.routeConstructors = {
        indexRoute: function indexRoute(indexUid) {
          return Index.apiRoutes.indexes + "/" + indexUid;
        },
        getUpdateStatus: function getUpdateStatus(indexUid, updateId) {
          return Index.routeConstructors.indexRoute(indexUid) + '/' + ("updates/" + updateId);
        },
        getAllUpdateStatus: function getAllUpdateStatus(indexUid) {
          return Index.routeConstructors.indexRoute(indexUid) + '/' + "updates";
        },
        search: function search(indexUid) {
          return Index.routeConstructors.indexRoute(indexUid) + '/' + "search";
        },
        getRawInfo: function getRawInfo(indexUid) {
          return "indexes/" + indexUid;
        },
        update: function update(indexUid) {
          return Index.routeConstructors.indexRoute(indexUid);
        },
        "delete": function _delete(indexUid) {
          return Index.routeConstructors.indexRoute(indexUid);
        },
        getStats: function getStats(indexUid) {
          return Index.routeConstructors.indexRoute(indexUid) + '/' + "stats";
        },
        getDocument: function getDocument(indexUid, documentId) {
          return Index.routeConstructors.indexRoute(indexUid) + '/' + ("documents/" + documentId);
        },
        getDocuments: function getDocuments(indexUid) {
          return Index.routeConstructors.indexRoute(indexUid) + '/' + "documents";
        },
        addDocuments: function addDocuments(indexUid) {
          return Index.routeConstructors.getDocuments(indexUid);
        },
        updateDocuments: function updateDocuments(indexUid) {
          return Index.routeConstructors.getDocuments(indexUid);
        },
        deleteAllDocuments: function deleteAllDocuments(indexUid) {
          return Index.routeConstructors.getDocuments(indexUid);
        },
        deleteDocument: function deleteDocument(indexUid, documentId) {
          return Index.routeConstructors.indexRoute(indexUid) + '/' + ("documents/" + documentId);
        },
        deleteDocuments: function deleteDocuments(indexUid) {
          return Index.routeConstructors.indexRoute(indexUid) + '/' + "documents/delete-batch";
        },
        getSettings: function getSettings(indexUid) {
          return Index.routeConstructors.indexRoute(indexUid) + '/' + "settings";
        },
        updateSettings: function updateSettings(indexUid) {
          return Index.routeConstructors.getSettings(indexUid);
        },
        resetSettings: function resetSettings(indexUid) {
          return Index.routeConstructors.getSettings(indexUid);
        },
        getSynonyms: function getSynonyms(indexUid) {
          return Index.routeConstructors.indexRoute(indexUid) + '/' + "settings/synonyms";
        },
        updateSynonyms: function updateSynonyms(indexUid) {
          return Index.routeConstructors.getSynonyms(indexUid);
        },
        resetSynonyms: function resetSynonyms(indexUid) {
          return Index.routeConstructors.getSynonyms(indexUid);
        },
        getStopWords: function getStopWords(indexUid) {
          return Index.routeConstructors.indexRoute(indexUid) + '/' + "settings/stop-words";
        },
        updateStopWords: function updateStopWords(indexUid) {
          return Index.routeConstructors.getStopWords(indexUid);
        },
        resetStopWords: function resetStopWords(indexUid) {
          return Index.routeConstructors.getStopWords(indexUid);
        },
        getRankingRules: function getRankingRules(indexUid) {
          return Index.routeConstructors.indexRoute(indexUid) + '/' + "settings/ranking-rules";
        },
        updateRankingRules: function updateRankingRules(indexUid) {
          return Index.routeConstructors.getRankingRules(indexUid);
        },
        resetRankingRules: function resetRankingRules(indexUid) {
          return Index.routeConstructors.getRankingRules(indexUid);
        },
        getDistinctAttribute: function getDistinctAttribute(indexUid) {
          return Index.routeConstructors.indexRoute(indexUid) + '/' + "settings/distinct-attribute";
        },
        updateDistinctAttribute: function updateDistinctAttribute(indexUid) {
          return Index.routeConstructors.getDistinctAttribute(indexUid);
        },
        resetDistinctAttribute: function resetDistinctAttribute(indexUid) {
          return Index.routeConstructors.getDistinctAttribute(indexUid);
        },
        getAttributesForFaceting: function getAttributesForFaceting(indexUid) {
          return Index.routeConstructors.indexRoute(indexUid) + '/' + "settings/attributes-for-faceting";
        },
        updateAttributesForFaceting: function updateAttributesForFaceting(indexUid) {
          return Index.routeConstructors.getAttributesForFaceting(indexUid);
        },
        resetAttributesForFaceting: function resetAttributesForFaceting(indexUid) {
          return Index.routeConstructors.getAttributesForFaceting(indexUid);
        },
        getSearchableAttributes: function getSearchableAttributes(indexUid) {
          return Index.routeConstructors.indexRoute(indexUid) + '/' + "settings/searchable-attributes";
        },
        updateSearchableAttributes: function updateSearchableAttributes(indexUid) {
          return Index.routeConstructors.getSearchableAttributes(indexUid);
        },
        resetSearchableAttributes: function resetSearchableAttributes(indexUid) {
          return Index.routeConstructors.getSearchableAttributes(indexUid);
        },
        getDisplayedAttributes: function getDisplayedAttributes(indexUid) {
          return Index.routeConstructors.indexRoute(indexUid) + '/' + "settings/displayed-attributes";
        },
        updateDisplayedAttributes: function updateDisplayedAttributes(indexUid) {
          return Index.routeConstructors.getDisplayedAttributes(indexUid);
        },
        resetDisplayedAttributes: function resetDisplayedAttributes(indexUid) {
          return Index.routeConstructors.getDisplayedAttributes(indexUid);
        }
      };
      return Index;
    }();

    /*
     * Bundle: MeiliSearch
     * Project: MeiliSearch - Javascript API
     * Author: Quentin de Quelen <quentin@meilisearch.com>
     * Copyright: 2019, MeiliSearch
     */

    var MeiliSearch =
    /** @class */
    function () {
      function MeiliSearch(config) {
        config.host = HttpRequests.addTrailingSlash(config.host);
        this.config = config;
        this.httpRequest = new HttpRequests(config);
      }

      MeiliSearch.getApiRoutes = function () {
        return MeiliSearch.apiRoutes;
      };

      MeiliSearch.getRouteConstructors = function () {
        return MeiliSearch.routeConstructors;
      };
      /**
       * Return an Index instance
       * @memberof MeiliSearch
       * @method index
       */


      MeiliSearch.prototype.index = function (indexUid) {
        return new Index(this.config, indexUid);
      };
      /**
       * Gather information about an index by calling MeiliSearch and
       * return an Index instance with the gathered information
       * @memberof MeiliSearch
       * @method getIndex
       */


      MeiliSearch.prototype.getIndex = function (indexUid) {
        return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            return [2
            /*return*/
            , new Index(this.config, indexUid).fetchInfo()];
          });
        });
      };
      /**
       * Get an index or create it if it does not exist
       * @memberof MeiliSearch
       * @method getOrCreateIndex
       */


      MeiliSearch.prototype.getOrCreateIndex = function (uid, options) {
        if (options === void 0) {
          options = {};
        }

        return __awaiter(this, void 0, void 0, function () {
          var index, e_1;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                _a.trys.push([0, 2,, 3]);

                return [4
                /*yield*/
                , this.getIndex(uid)];

              case 1:
                index = _a.sent();
                return [2
                /*return*/
                , index];

              case 2:
                e_1 = _a.sent();

                if (e_1.errorCode === 'index_not_found') {
                  return [2
                  /*return*/
                  , this.createIndex(uid, options)];
                }

                throw new MeiliSearchApiError(e_1, e_1.status);

              case 3:
                return [2
                /*return*/
                ];
            }
          });
        });
      };
      /**
       * List all indexes in the database
       * @memberof MeiliSearch
       * @method listIndexes
       */


      MeiliSearch.prototype.listIndexes = function () {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = MeiliSearch.apiRoutes.listIndexes;
                return [4
                /*yield*/
                , this.httpRequest.get(url)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };
      /**
       * Create a new index
       * @memberof MeiliSearch
       * @method createIndex
       */


      MeiliSearch.prototype.createIndex = function (uid, options) {
        if (options === void 0) {
          options = {};
        }

        return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                return [4
                /*yield*/
                , Index.create(this.config, uid, options)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };
      /**
       * Update an index
       * @memberof MeiliSearch
       * @method updateIndex
       */


      MeiliSearch.prototype.updateIndex = function (uid, options) {
        if (options === void 0) {
          options = {};
        }

        return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            return [2
            /*return*/
            , new Index(this.config, uid).update(options)];
          });
        });
      };
      /**
       * Delete an index
       * @memberof MeiliSearch
       * @method deleteIndex
       */


      MeiliSearch.prototype.deleteIndex = function (uid) {
        return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            return [2
            /*return*/
            , new Index(this.config, uid)["delete"]()];
          });
        });
      }; ///
      /// KEYS
      ///

      /**
       * Get private and public key
       * @memberof MeiliSearch
       * @method getKey
       */


      MeiliSearch.prototype.getKeys = function () {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = MeiliSearch.apiRoutes.getKeys;
                return [4
                /*yield*/
                , this.httpRequest.get(url)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      }; ///
      /// HEALTH
      ///

      /**
       * Checks if the server is healthy, otherwise an error will be thrown.
       *
       * @memberof MeiliSearch
       * @method isHealthy
       */


      MeiliSearch.prototype.isHealthy = function () {
        return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                return [4
                /*yield*/
                , this.httpRequest.get(MeiliSearch.apiRoutes.isHealthy).then(function () {
                  return true;
                })];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      }; ///
      /// STATS
      ///

      /**
       * Get the stats of all the database
       * @memberof MeiliSearch
       * @method stats
       */


      MeiliSearch.prototype.stats = function () {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = MeiliSearch.apiRoutes.stats;
                return [4
                /*yield*/
                , this.httpRequest.get(url)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };
      /**
       * Get the version of MeiliSearch
       * @memberof MeiliSearch
       * @method version
       */


      MeiliSearch.prototype.version = function () {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = MeiliSearch.apiRoutes.version;
                return [4
                /*yield*/
                , this.httpRequest.get(url)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      }; ///
      /// DUMPS
      ///

      /**
       * Triggers a dump creation process
       * @memberof MeiliSearch
       * @method createDump
       */


      MeiliSearch.prototype.createDump = function () {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = MeiliSearch.apiRoutes.createDump;
                return [4
                /*yield*/
                , this.httpRequest.post(url)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };
      /**
       * Get the status of a dump creation process
       * @memberof MeiliSearch
       * @method getDumpStatus
       */


      MeiliSearch.prototype.getDumpStatus = function (dumpUid) {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = MeiliSearch.routeConstructors.getDumpStatus(dumpUid);
                return [4
                /*yield*/
                , this.httpRequest.get(url)];

              case 1:
                return [2
                /*return*/
                , _a.sent()];
            }
          });
        });
      };

      MeiliSearch.apiRoutes = {
        listIndexes: 'indexes',
        getKeys: 'keys',
        isHealthy: 'health',
        stats: 'stats',
        version: 'version',
        createDump: 'dumps'
      };
      MeiliSearch.routeConstructors = {
        getDumpStatus: function getDumpStatus(dumpUid) {
          return "dumps/" + dumpUid + "/status";
        }
      };
      return MeiliSearch;
    }();

    exports.MeiliSearch = MeiliSearch;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
