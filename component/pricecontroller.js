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
exports.eventEmmiter = exports.getAllOrderBooks = void 0;
exports.intervalFunc = intervalFunc;
exports.checkCondition = checkCondition;
const stream_1 = require("stream");
const symbols_1 = __importDefault(require("../symbols/symbols"));
const exController_1 = require("./exController");
Object.defineProperty(exports, "getAllOrderBooks", { enumerable: true, get: function () { return exController_1.getAllOrderBooks; } });
const eventEmmiter = new stream_1.EventEmitter();
exports.eventEmmiter = eventEmmiter;
eventEmmiter.setMaxListeners(6);
let intervalStatus = true;
const myPercent = process.env.MYPERCENT || 1;
function intervalFunc() {
    return __awaiter(this, void 0, void 0, function* () {
        return setInterval(function () {
            return __awaiter(this, void 0, void 0, function* () {
                if (intervalStatus) {
                    const rowsInfo = [];
                    let maxDiffObj = {};
                    try {
                        const [coinOrderBooks, nobOrderBooks] = yield (0, exController_1.getAllOrderBooks)("all");
                        if (coinOrderBooks.status === "fulfilled" && nobOrderBooks.status === "fulfilled") {
                            for (const symbol of symbols_1.default.nobCoinIRT) {
                                const rowInfo = yield getRowTableAndTrade(nobOrderBooks.value[symbol[0]], coinOrderBooks.value[symbol[1]], symbol);
                                if (rowInfo !== false) {
                                    rowsInfo.push(rowInfo[0]);
                                }
                            }
                        }
                    }
                    catch (error) {
                        console.log("orderBooks Gerefteh Nashod: ", error.message);
                    }
                    finally {
                        eventEmmiter.emit("diff", JSON.stringify(rowsInfo));
                    }
                }
            });
        }, 5000);
    });
}
function getRowTableAndTrade(nobOrderSymbol, coinOrderSymbol, symbol) {
    return __awaiter(this, void 0, void 0, function* () {
        const exsistAskBidbool = exsistAskBid(nobOrderSymbol, coinOrderSymbol);
        if (exsistAskBidbool) {
            const nobBuyTthr = nobOrderSymbol.ask[0];
            const coinSellTthr = coinOrderSymbol.bid[0];
            if (buySmallerSell(nobBuyTthr, coinSellTthr)) {
                const [percent, amount, amountRls] = calcPercentAndAmounts(nobOrderSymbol["ask"], coinOrderSymbol["bid"]);
                console.log("asd:", percent, "|", myPercent);
                if (percent > +myPercent && amountRls > 3500000) {
                    const [newCoinOrderBooks, newNobOrderBooks] = yield (0, exController_1.getAllOrderBooks)(symbol);
                    if (newCoinOrderBooks.status == "fulfilled" && newNobOrderBooks.status == "fulfilled") {
                        const [newPercent, newAmount, newAmountRls] = calcPercentAndAmounts(newNobOrderBooks.value[symbol[0]].ask, newCoinOrderBooks.value[symbol[1]].bid);
                        if (newPercent > myPercent && newAmountRls > 3500000) {
                            intervalStatus = false;
                            const newNobBuyRls = newNobOrderBooks.value[symbol[0]].ask[2];
                            (0, exController_1.NobitexBuyHandler)(newNobBuyRls, symbol[0], newAmount, newAmountRls, newPercent)
                                .finally(function () {
                                intervalStatus = true;
                            });
                        }
                    }
                }
                return [createRowTable(nobOrderSymbol.ask, coinSellTthr, percent, amount, amountRls, symbol)];
            }
            return false;
        }
    });
}
function exsistAskBid(nobOrderSymbol, coinOrderSymbol) {
    return ((nobOrderSymbol === null || nobOrderSymbol === void 0 ? void 0 : nobOrderSymbol.bid.length) == 3 &&
        (nobOrderSymbol === null || nobOrderSymbol === void 0 ? void 0 : nobOrderSymbol.ask.length) == 3 &&
        (coinOrderSymbol === null || coinOrderSymbol === void 0 ? void 0 : coinOrderSymbol.bid.length) == 2 &&
        (coinOrderSymbol === null || coinOrderSymbol === void 0 ? void 0 : coinOrderSymbol.ask.length) == 2);
}
function buySmallerSell(buy, sell) {
    return buy < sell;
}
function calcPercentAndAmounts(buyOrder, sellOrder) {
    const percent = calculatePercentageDifference(buyOrder[0], sellOrder[0]);
    const amount = buyOrder[1];
    const amountRls = Math.floor(amount * buyOrder[2]);
    return [percent, amount, amountRls];
}
function calculatePercentageDifference(buyPrice, sellPrice) {
    const priceDifference = sellPrice - buyPrice;
    const percentageDifference = (priceDifference / buyPrice) * 100;
    return Number(percentageDifference.toFixed(2));
}
function checkCondition(cond) {
    if (!cond || typeof cond.nobBalanceRls === "undefined") {
        console.error("nobBalanceRls is not defined in cond:", cond);
        return false;
    }
    console.log("cond:", cond);
    return (cond.nobBalanceRls > 1500000 &&
        cond.nobInOrder == 0);
}
function createRowTable(nobAsk, coinTthr, percentDiff, amount, amountRls, symbol) {
    const rowData = {
        symbol: symbol[0],
        percent: percentDiff,
        nob: [nobAsk[0].toString() + "|", (nobAsk[2] / 10).toString()],
        coin: coinTthr.toString(),
        value: Math.floor(Math.abs(coinTthr - nobAsk[0])),
        description: `Curr:${amount} | Toomani:${amountRls / 10}`,
    };
    const statusbuy = nobAsk[0] < coinTthr ? "nob" : "coin";
    return {
        statusbuy,
        rowData,
    };
}
