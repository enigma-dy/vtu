"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const data_routes_1 = __importDefault(require("./routes/data.routes"));
const payment_route_1 = __importDefault(require("./routes/payment.route"));
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
const port = 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/pricing', data_routes_1.default);
app.use('/payment', payment_route_1.default);
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
