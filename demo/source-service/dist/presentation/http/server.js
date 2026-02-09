"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
// Presentation: HTTP Server
const express_1 = __importDefault(require("express"));
const routes_1 = require("./routes");
function createServer(pool) {
    const app = (0, express_1.default)();
    // Middleware
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    // Request logging
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
        next();
    });
    // Routes
    app.use((0, routes_1.createRoutes)(pool));
    // Error handler
    app.use((err, req, res, next) => {
        console.error("Unhandled error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    });
    return app;
}
//# sourceMappingURL=server.js.map