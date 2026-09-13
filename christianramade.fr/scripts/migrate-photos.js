"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var prisma_1 = require("@/app/_lib/prisma");
var client_1 = require("@/app/generated/prisma/client");
var S3Uploader_1 = require("@/app/_lib/S3Uploader");
var image_optimizer_1 = require("@/app/_lib/image-optimizer");
/**
 * Script de migration : optimise les photos existantes qui n'ont pas encore
 * de variantes responsives (les 260 photos uploadées avant le pipeline Sharp).
 *
 * Pour chaque photo :
 *   1. Télécharge l'original depuis S3.
 *   2. Génère 4 tailles WebP (full/large/medium/small) avec Sharp.
 *   3. Upload les variantes en S3.
 *   4. Met à jour la photo (url/key → version full, variants).
 *   5. Supprime l'ancien original (optionnel, via --delete-original).
 *
 * Usage:
 *   npx tsx scripts/migrate-photos.ts
 *   npx tsx scripts/migrate-photos.ts --delete-original   # supprime les originaux
 *   npx tsx scripts/migrate-photos.ts --limit 10          # traite seulement 10 photos
 */
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var deleteOriginal, limitArg, limit, photos, ok, failed, _loop_1, _i, photos_1, photo;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    deleteOriginal = process.argv.includes('--delete-original');
                    limitArg = process.argv.find(function (a) { return a.startsWith('--limit='); });
                    limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;
                    return [4 /*yield*/, prisma_1.prisma.photo.findMany(__assign({ where: { variants: { equals: client_1.Prisma.DbNull } }, orderBy: { createdAt: 'asc' } }, (limit ? { take: limit } : {})))];
                case 1:
                    photos = _b.sent();
                    console.log("\uD83D\uDCF8 ".concat(photos.length, " photo(s) \u00E0 optimiser."));
                    ok = 0;
                    failed = 0;
                    _loop_1 = function (photo) {
                        var buffer, sizes, baseKey_1, uploaded_1, full, variants, err_1;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    _c.trys.push([0, 7, , 8]);
                                    return [4 /*yield*/, (0, S3Uploader_1.downloadFileFromS3)(photo.key)];
                                case 1:
                                    buffer = (_c.sent()).buffer;
                                    console.log("  \u21B3 ".concat(photo.key, " (").concat((buffer.length / 1024).toFixed(0), " Ko)"));
                                    return [4 /*yield*/, (0, image_optimizer_1.generateResponsiveSizes)(buffer)
                                        // Clé de base dérivée de l'ancienne clé (sans extension)
                                    ];
                                case 2:
                                    sizes = _c.sent();
                                    baseKey_1 = photo.key.replace(/\.[^.]+$/, '');
                                    return [4 /*yield*/, Promise.all(sizes.map(function (s) {
                                            return (0, S3Uploader_1.uploadOptimizedBuffer)(s.buffer, baseKey_1, s.suffix, 'image/webp');
                                        }))];
                                case 3:
                                    uploaded_1 = _c.sent();
                                    full = (_a = uploaded_1.find(function (u) { return u.key.endsWith('-full.webp'); })) !== null && _a !== void 0 ? _a : uploaded_1[0];
                                    variants = image_optimizer_1.IMAGE_SIZES.map(function (size, idx) { return ({
                                        suffix: size.suffix,
                                        width: size.width,
                                        url: uploaded_1[idx].url,
                                        key: uploaded_1[idx].key,
                                    }); });
                                    // 4. Met à jour la photo
                                    return [4 /*yield*/, prisma_1.prisma.photo.update({
                                            where: { id: photo.id },
                                            data: {
                                                url: full.url,
                                                key: full.key,
                                                variants: variants,
                                            },
                                        })
                                        // 5. Supprime l'ancien original (optionnel)
                                    ];
                                case 4:
                                    // 4. Met à jour la photo
                                    _c.sent();
                                    if (!(deleteOriginal && photo.key !== full.key)) return [3 /*break*/, 6];
                                    return [4 /*yield*/, (0, S3Uploader_1.deleteFileFromS3)(photo.key).catch(function () { })];
                                case 5:
                                    _c.sent();
                                    _c.label = 6;
                                case 6:
                                    ok++;
                                    console.log("  \u2705 ".concat(photo.id, " \u2192 ").concat(variants.length, " variantes"));
                                    return [3 /*break*/, 8];
                                case 7:
                                    err_1 = _c.sent();
                                    failed++;
                                    console.error("  \u274C ".concat(photo.id, " (").concat(photo.key, "):"), err_1);
                                    return [3 /*break*/, 8];
                                case 8: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, photos_1 = photos;
                    _b.label = 2;
                case 2:
                    if (!(_i < photos_1.length)) return [3 /*break*/, 5];
                    photo = photos_1[_i];
                    return [5 /*yield**/, _loop_1(photo)];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    console.log("\nTermin\u00E9 : ".concat(ok, " optimis\u00E9e(s), ").concat(failed, " en \u00E9chec."));
                    if (failed > 0) {
                        console.log('Relancez le script pour réessayer les photos en échec (idempotent).');
                    }
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (err) {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma_1.prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
