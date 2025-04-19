"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpGetCoinexOrderBooks = httpGetCoinexOrderBooks;
const axios_1 = __importDefault(require("axios"));
const https_proxy_agent_1 = require("https-proxy-agent");
const symbols_1 = __importDefault(require("../../symbols/symbols"));
const agent = new https_proxy_agent_1.HttpsProxyAgent("http://127.0.0.1:10808");
const coinBaseUrl = new URL("https://api.coinex.com/v2/");
const coinInstance = axios_1.default.create({
    baseURL: coinBaseUrl.toString(),
    httpsAgent: agent,
});
function httpGetCoinexOrderBook(pair) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield coinInstance.get("/spot/depth", {
            params: {
                market: pair,
                limit: 5,
                interval: "0.01",
            },
        });
        const coinexOrderBooks = sortCoinexOrderBooks(response.data.data);
        return coinexOrderBooks;
    });
}
function sortCoinexOrderBooks(data) {
    const ask = data.depth.asks[0];
    const bid = data.depth.bids[0];
    return {
        [data.market]: { ask, bid },
    };
}
function httpGetCoinexOrderBooks(pair) {
    return __awaiter(this, void 0, void 0, function* () {
        let sortedCoinexOrderBooksPromise;
        if (pair == "all") {
            sortedCoinexOrderBooksPromise =
                symbols_1.default.nobCoinIRT.map(function (symbol) {
                    return __awaiter(this, void 0, void 0, function* () {
                        return httpGetCoinexOrderBook(symbol[1]);
                    });
                });
        }
        else {
            sortedCoinexOrderBooksPromise = [httpGetCoinexOrderBook(pair)];
        }
        const sortedCoinexOrderBooksArray = yield Promise.allSettled(sortedCoinexOrderBooksPromise);
        const sortedCoinexOrderBooks = {};
        sortedCoinexOrderBooksArray.forEach(function (orderbook) {
            if (orderbook.status == "fulfilled") {
                Object.assign(sortedCoinexOrderBooks, orderbook.value);
            }
        });
        return sortedCoinexOrderBooks;
    });
}
