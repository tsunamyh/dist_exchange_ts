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
require("dotenv/config");
const server_1 = require("../server");
const pricecontroller_1 = require("../component/pricecontroller");
const exController_1 = require("../component/exController");
const port = Number(process.env.PORT) || 3015;
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        server_1.server.listen(port, () => {
            console.log("Server is listening on port");
        });
        try {
            let conditionObj = yield (0, exController_1.getBalanceAndInOrder)();
            if ((0, pricecontroller_1.checkCondition)(conditionObj)) {
                console.log("Done check condition");
                (0, pricecontroller_1.intervalFunc)();
            }
        }
        catch (error) {
            console.log("hanooz shoroo nashode:", error.message);
        }
    });
}
start();
