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
Object.defineProperty(exports, "__esModule", { value: true });
exports.condition = void 0;
exports.getAllOrderBooks = getAllOrderBooks;
exports.getBalanceAndInOrder = getBalanceAndInOrder;
exports.NobitexBuyHandler = NobitexBuyHandler;
exports.getCondition = getCondition;
const coinserver_1 = require("./exchanges/coinserver");
const nobserver_1 = require("./exchanges/nobserver");
function getAllOrderBooks(pair) {
    return __awaiter(this, void 0, void 0, function* () {
        let coinOrderBooksPromise;
        let nobOrderBooksPromise;
        if (Array.isArray(pair)) {
            coinOrderBooksPromise = (0, coinserver_1.httpGetCoinexOrderBooks)(pair[1]);
            nobOrderBooksPromise = (0, nobserver_1.httpGetNobOrderBooks)(pair[0]);
        }
        else {
            coinOrderBooksPromise = (0, coinserver_1.httpGetCoinexOrderBooks)(pair);
            nobOrderBooksPromise = (0, nobserver_1.httpGetNobOrderBooks)(pair);
        }
        const promisesArray = [coinOrderBooksPromise, nobOrderBooksPromise];
        const allOrderBooks = yield Promise.allSettled(promisesArray);
        return allOrderBooks;
    });
}
let nobInOrder;
let nobBalanceRls;
let condition;
let tradeTime = 0;
function getBalanceAndInOrder() {
    return __awaiter(this, arguments, void 0, function* (symbol = "rls") {
        try {
            const promisesConditionArray = [
                (0, nobserver_1.nobitexGetInOrder)(symbol),
                (0, nobserver_1.getCurrencyBalanceNob)(symbol),
            ];
            const result = yield Promise.all(promisesConditionArray);
            if (result) {
                [nobInOrder, nobBalanceRls] = result;
            }
            else {
                nobInOrder = false;
                nobBalanceRls = 0;
            }
            exports.condition = condition = {
                nobBalanceRls: Math.floor(nobBalanceRls || 0),
                nobInOrder: nobInOrder || false,
            };
            console.log("condition:", condition);
            return condition;
        }
        catch (err) {
            console.error("Error in getBalanceAndInOrder:", err.message);
            return null;
        }
    });
}
function NobitexBuyHandler(nobBuyRls, symbol, amount, amountRls, percent) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("🛒 Starting Nobitex Buy Handler");
        const now = Date.now();
        const diffTime = now - tradeTime;
        if (diffTime <= 6000) {
            console.log("⏱️ Buy skipped - less than 6 seconds since last trade");
            return;
        }
        const newAmount = buyNobitexFindAmount(nobBuyRls, amount);
        tradeTime = now;
        try {
            yield (0, nobserver_1.nobitexTrade)("buy", symbol, newAmount, nobBuyRls);
            console.log("✅ Trade executed successfully");
        }
        catch (error) {
            console.error("❌ Trade failed (buyNobSellRam):", error.message);
            return;
        }
        try {
            yield getBalanceAndInOrder(symbol);
            const logObj = {
                date: new Date().toLocaleString(),
                buyNSellRCndtinArr: { nobInOrder },
                nobBuyRls,
                amount,
                newAmount,
                amountRls,
                percent,
            };
            console.log("📊 Trade Log:", logObj);
        }
        catch (error) {
            console.error("⚠️ Error in post-trade balance fetch:", error.message);
        }
    });
}
function buyNobitexFindAmount(nobBuyRls, amount) {
    const minAmount = Math.min((nobBalanceRls || 0) / +nobBuyRls, amount) * 0.94;
    return minAmount;
}
function getCondition() {
    return condition;
}
