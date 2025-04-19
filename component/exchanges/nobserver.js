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
exports.httpGetNobOrderBooks = httpGetNobOrderBooks;
exports.nobitexTrade = nobitexTrade;
exports.nobitexGetInOrder = nobitexGetInOrder;
exports.getCurrencyBalanceNob = getCurrencyBalanceNob;
const axios_1 = __importDefault(require("axios"));
const symbols_1 = __importDefault(require("../../symbols/symbols"));
const nobToken = process.env.NOBTOKEN;
console.log("process.env.NOBTOKEN : ", nobToken);
const nobCoinex = symbols_1.default.nobCoinIRT;
const nobBaseUrl = "https://api.nobitex.ir/";
const nobInstance = axios_1.default.create({
    baseURL: nobBaseUrl,
    headers: {
        Authorization: "Token " + nobToken
    }
});
function httpGetNobOrderBooks(symbol) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield nobInstance.get(`/v3/orderbook/all`);
        const sortedOrderBooks = sortOrderBooks(response.data, symbol);
        return sortedOrderBooks;
    });
}
function sortOrderBooks(data, specificSymbol) {
    var _a, _b, _c, _d;
    const ttrAsk = data["USDTIRT"].asks[0][0];
    const ttrBid = data["USDTIRT"].bids[0][0];
    const sortedOrderBooks = {};
    if (specificSymbol = "all") {
        nobCoinex.forEach(function (symbol) {
            var _a, _b, _c, _d;
            if (!(((_a = data[symbol[0]]) === null || _a === void 0 ? void 0 : _a.asks) === undefined || ((_b = data[symbol[0]]) === null || _b === void 0 ? void 0 : _b.bids.length) === 0)) {
                const ask = (_c = data[symbol[0]]) === null || _c === void 0 ? void 0 : _c.asks[0];
                const bid = (_d = data[symbol[0]]) === null || _d === void 0 ? void 0 : _d.bids[0];
                if (ask && bid) {
                    sortedOrderBooks[symbol[0]] = {
                        ask: [formatToSixDigitsMath(ask[0] / ttrBid), ask[1].toString(), ask[0].toString()],
                        bid: [formatToSixDigitsMath(bid[0] / ttrAsk), bid[1].toString(), bid[0].toString()],
                    };
                }
            }
        });
    }
    else {
        if (!(((_a = data[specificSymbol]) === null || _a === void 0 ? void 0 : _a.asks) === undefined || ((_b = data[specificSymbol]) === null || _b === void 0 ? void 0 : _b.bids.length) === 0)) {
            const ask = (_c = data[specificSymbol]) === null || _c === void 0 ? void 0 : _c.asks[0];
            const bid = (_d = data[specificSymbol]) === null || _d === void 0 ? void 0 : _d.bids[0];
            if (ask && bid) {
                sortedOrderBooks[specificSymbol] = {
                    ask: [formatToSixDigitsMath(ask[0] / ttrBid), ask[1].toString(), ask[0].toString()],
                    bid: [formatToSixDigitsMath(bid[0] / ttrAsk), bid[1].toString(), bid[0].toString()],
                };
            }
        }
    }
    return sortedOrderBooks;
}
function formatToSixDigitsMath(value) {
    if (Number.isInteger(value)) {
        return value.toString();
    }
    if (value >= 100000) {
        return Math.floor(value).toString().slice(0, 6);
    }
    const factor = Math.pow(10, 6 - Math.floor(Math.log10(value)) - 1);
    return (Math.floor(value * factor) / factor).toString();
}
function nobitexTrade(type, symbol, amount, price) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("symbolnobtrade:", symbol, price);
        let srcCurrency = symbol.toLowerCase();
        let dstCurrency;
        if (srcCurrency.endsWith("irt")) {
            srcCurrency = srcCurrency.slice(0, -3);
            dstCurrency = "rls";
        }
        else if (srcCurrency.endsWith("usdt")) {
            srcCurrency = srcCurrency.slice(0, -4);
            dstCurrency = "usdt";
        }
        const axiosConfig = {
            method: "post",
            url: "/market/orders/add",
            data: {
                type,
                execution: "market",
                srcCurrency: srcCurrency,
                dstCurrency: dstCurrency,
                amount,
                price,
            }
        };
        try {
            const response = yield nobInstance(axiosConfig);
            console.log("nooooooooooooob:(", type, symbol, ")::", response.data);
            return response.data;
        }
        catch (error) {
            console.log("nob naTradid:", error.message);
            throw error;
        }
    });
}
function nobitexGetInOrder(symbol) {
    return __awaiter(this, void 0, void 0, function* () {
        let srcCurrency = symbol.toLowerCase();
        let dstCurrency;
        if (srcCurrency.endsWith("irt")) {
            srcCurrency = srcCurrency.slice(0, -3);
            dstCurrency = "rls";
        }
        else if (srcCurrency.endsWith("usdt")) {
            srcCurrency = srcCurrency.slice(0, -4);
            dstCurrency = "usdt";
        }
        const axiosConfig = {
            url: "/market/orders/list",
            params: {
                srcCurrency,
                dstCurrency,
            }
        };
        try {
            const response = yield nobInstance(axiosConfig);
            if (response.data.orders.length == 0) {
                return 0;
            }
            else {
                console.log("inOrderNobitex " + symbol + response.data.orders[0]["amount"]);
                return false;
            }
        }
        catch (error) {
            console.log("🚀 ~ file: nobserver.js:90 ~ getInOrderNob ~ error:", error.message);
            throw error;
        }
    });
}
function getCurrencyBalanceNob(symbol) {
    return __awaiter(this, void 0, void 0, function* () {
        let currency = symbol.toLowerCase();
        if (currency.endsWith("irt")) {
            currency = "rls";
        }
        else if (currency.endsWith("usdt")) {
            currency = "usdt";
        }
        const axiosConfig = {
            method: "post",
            url: "/users/wallets/balance",
            data: {
                currency
            }
        };
        try {
            const response = yield nobInstance(axiosConfig);
            return Number(response.data.balance);
        }
        catch (error) {
            console.log("🚀 ~ file: nobserver.js:113 ~ getCurrencyBalanceNob ~ error:", error.message);
            throw error;
        }
    });
}
