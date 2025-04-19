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
exports.server = void 0;
const ws_1 = require("ws");
const http_1 = __importDefault(require("http"));
const app_1 = require("./app");
const pricecontroller_1 = require("./component/pricecontroller");
const server = http_1.default.createServer(app_1.app);
exports.server = server;
const wss = new ws_1.WebSocketServer({
    noServer: true,
    path: "/diff",
    clientTracking: false,
});
const clients = new Set();
function diffListener(rowsInfo) {
    clients.forEach(function (client) {
        client.send(rowsInfo);
    });
}
server.on("upgrade", function (req, socket, head) {
    wss.handleUpgrade(req, socket, head, function (ws) {
        return __awaiter(this, void 0, void 0, function* () {
            clients.add(ws);
            const clientSize = { size: clients.size };
            diffListener(JSON.stringify(clientSize));
            console.log("clients:", clientSize);
            wss.emit("connection", ws, req);
        });
    });
});
wss.on("connection", function connection(ws, req) {
    return __awaiter(this, void 0, void 0, function* () {
        pricecontroller_1.eventEmmiter.on("diff", diffListener);
        ws.on("close", () => {
            clients.delete(ws);
            pricecontroller_1.eventEmmiter.removeListener("diff", diffListener);
            console.log("clients.size:", clients.size);
            console.log("Client disconnected");
        });
        ws.on("error", function () {
            console.log("Some Error occurred");
        });
    });
});
