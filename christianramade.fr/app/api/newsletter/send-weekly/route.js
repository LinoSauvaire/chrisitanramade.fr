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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
var server_1 = require("next/server");
var prisma_1 = require("@/app/_lib/prisma");
/**
 * Route API appelée par un cron (ex: cron-job.org, Vercel Cron, etc.)
 * GET /api/newsletter/send-weekly?secret=XXX
 *
 * Détecte les tickets publiés dans les 7 derniers jours,
 * et envoie un email à tous les abonnés.
 */
function GET(request) {
    return __awaiter(this, void 0, void 0, function () {
        var searchParams, secret, resendApiKey, fromEmail, oneWeekAgo, newTickets, subscribers, profile, authorName, ticketsList, html, sent, errors, i, batch, bcc, res, _a, _b, _c, err_1;
        var _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    searchParams = new URL(request.url).searchParams;
                    secret = searchParams.get('secret');
                    if (!secret || secret !== process.env.NEWSLETTER_CRON_SECRET) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: 'Non autorisé' }, { status: 401 })];
                    }
                    resendApiKey = process.env.RESEND_API_KEY;
                    fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
                    oneWeekAgo = new Date();
                    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                    return [4 /*yield*/, prisma_1.prisma.ticket.findMany({
                            where: {
                                status: 'published',
                                createdAt: { gte: oneWeekAgo },
                            },
                            select: { id: true, title: true, slug: true, excerpt: true, createdAt: true },
                            orderBy: { createdAt: 'desc' },
                        })];
                case 1:
                    newTickets = _e.sent();
                    return [4 /*yield*/, prisma_1.prisma.subscriber.findMany({
                            select: { email: true },
                        })];
                case 2:
                    subscribers = _e.sent();
                    if (subscribers.length === 0) {
                        return [2 /*return*/, server_1.NextResponse.json({ message: 'Aucun abonné.', sent: 0 })];
                    }
                    if (newTickets.length === 0) {
                        return [2 /*return*/, server_1.NextResponse.json({ message: 'Aucun nouveau ticket cette semaine.', sent: 0 })];
                    }
                    return [4 /*yield*/, prisma_1.prisma.profile.findFirst()];
                case 3:
                    profile = _e.sent();
                    authorName = (_d = profile === null || profile === void 0 ? void 0 : profile.name) !== null && _d !== void 0 ? _d : 'Christian Ramade';
                    ticketsList = newTickets
                        .map(function (t) { return "\n        <li style=\"margin-bottom:16px;\">\n          <a href=\"https://christianramade.fr/journal/".concat(t.slug, "\" style=\"color:#1a1a1a;text-decoration:none;font-size:16px;font-weight:600;\">\n            ").concat(t.title, "\n          </a>\n          ").concat(t.excerpt ? "<p style=\"color:#666;font-size:14px;margin-top:4px;\">".concat(t.excerpt, "</p>") : '', "\n        </li>"); })
                        .join('');
                    html = "\n    <div style=\"font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;\">\n      <h1 style=\"font-size:22px;color:#1a1a1a;margin-bottom:8px;\">".concat(authorName, "</h1>\n      <p style=\"color:#666;font-size:14px;margin-bottom:24px;\">\n        ").concat(newTickets.length, " nouveau").concat(newTickets.length > 1 ? 'x' : '', " billet").concat(newTickets.length > 1 ? 's' : '', " d'humeur cette semaine\n      </p>\n      <ul style=\"list-style:none;padding:0;margin:0;\">\n        ").concat(ticketsList, "\n      </ul>\n      <hr style=\"border:none;border-top:1px solid #eee;margin:32px 0;\">\n      <p style=\"font-size:12px;color:#999;\">\n        Vous recevez cet email car vous \u00EAtes inscrit \u00E0 la newsletter de ").concat(authorName, ".<br>\n        <a href=\"https://christianramade.fr/api/newsletter/unsubscribe?email=EMAIL_PLACEHOLDER\" style=\"color:#999;\">Se d\u00E9sinscrire</a>\n      </p>\n    </div>\n  ");
                    sent = 0;
                    errors = 0;
                    if (!resendApiKey) return [3 /*break*/, 13];
                    i = 0;
                    _e.label = 4;
                case 4:
                    if (!(i < subscribers.length)) return [3 /*break*/, 12];
                    batch = subscribers.slice(i, i + 50);
                    bcc = batch.map(function (s) { return s.email; });
                    _e.label = 5;
                case 5:
                    _e.trys.push([5, 10, , 11]);
                    return [4 /*yield*/, fetch('https://api.resend.com/emails', {
                            method: 'POST',
                            headers: {
                                Authorization: "Bearer ".concat(resendApiKey),
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                from: fromEmail,
                                to: [fromEmail],
                                bcc: bcc,
                                subject: "".concat(newTickets.length, " nouveau").concat(newTickets.length > 1 ? 'x' : '', " billet").concat(newTickets.length > 1 ? 's' : '', " d'humeur \u2014 ").concat(authorName),
                                html: html.replace(/EMAIL_PLACEHOLDER/g, ''),
                            }),
                        })];
                case 6:
                    res = _e.sent();
                    if (!res.ok) return [3 /*break*/, 7];
                    sent += batch.length;
                    return [3 /*break*/, 9];
                case 7:
                    _b = (_a = console).error;
                    _c = ['Erreur Resend:'];
                    return [4 /*yield*/, res.text()];
                case 8:
                    _b.apply(_a, _c.concat([_e.sent()]));
                    errors++;
                    _e.label = 9;
                case 9: return [3 /*break*/, 11];
                case 10:
                    err_1 = _e.sent();
                    console.error('Erreur envoi:', err_1);
                    errors++;
                    return [3 /*break*/, 11];
                case 11:
                    i += 50;
                    return [3 /*break*/, 4];
                case 12: return [3 /*break*/, 14];
                case 13:
                    // Pas de Resend configuré : log seulement
                    console.log("[Newsletter] ".concat(newTickets.length, " nouveaux tickets, ").concat(subscribers.length, " abonn\u00E9s"));
                    console.log("[Newsletter] RESEND_API_KEY non configur\u00E9 \u2014 aucun email envoy\u00E9");
                    sent = subscribers.length;
                    _e.label = 14;
                case 14: return [2 /*return*/, server_1.NextResponse.json({
                        newTickets: newTickets.length,
                        subscribers: subscribers.length,
                        sent: sent,
                        errors: errors,
                    })];
            }
        });
    });
}
