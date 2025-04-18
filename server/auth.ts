import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { 
  clientRegistrationSchema, 
  clientLoginSchema, 
  clientPasswordChangeSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema
} from "@shared/schema";
import { storage } from "./storage";
import MemoryStore from "memorystore";

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string | null;
      fullName: string | null;
      company: string | null;
      isAdmin: boolean;
      isClient: boolean;
    }
  }
}

const scryptAsync = promisify(scrypt);

// Funkcja do hashowania hasła
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Funkcja do porównywania hasła z hashem
export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const MemStore = MemoryStore(session);
  
  // Konfiguracja sesji
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "super-secret-key-for-dev-only",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000 // 24 godziny
    },
    store: new MemStore({
      checkPeriod: 86400000 // wyczyść wygasłe sesje co 24h
    })
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Strategia uwierzytelniania lokalna (username + password)
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          // Aktualizuj datę ostatniego logowania
          await storage.updateUser(user.id, { lastLogin: new Date() });
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }),
  );

  // Serializacja i deserializacja użytkownika
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Endpoint rejestracji
  app.post("/api/register", async (req, res, next) => {
    try {
      // Walidacja danych
      const validatedData = clientRegistrationSchema.parse(req.body);
      
      // Sprawdź czy nazwa użytkownika istnieje
      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        return res.status(400).json({ error: "Nazwa użytkownika już istnieje" });
      }
      
      // Sprawdź czy email istnieje
      if (validatedData.email) {
        const existingEmail = await storage.getUserByEmail(validatedData.email);
        if (existingEmail) {
          return res.status(400).json({ error: "Email jest już używany" });
        }
      }

      // Utwórz nowego użytkownika
      const user = await storage.createUser({
        ...validatedData,
        password: await hashPassword(validatedData.password),
        isClient: true,
        isAdmin: false
      });

      // Automatycznie zaloguj po rejestracji
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(201).json({
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          isClient: user.isClient
        });
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors });
      }
      next(error);
    }
  });

  // Endpoint logowania
  app.post("/api/login", (req, res, next) => {
    try {
      // Walidacja danych
      clientLoginSchema.parse(req.body);
      
      passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) {
          return res.status(401).json({ error: "Niepoprawna nazwa użytkownika lub hasło" });
        }
        
        req.login(user, (err) => {
          if (err) return next(err);
          return res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            isClient: user.isClient,
            isAdmin: user.isAdmin
          });
        });
      })(req, res, next);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors });
      }
      next(error);
    }
  });

  // Endpoint wylogowania
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Endpoint informacji o aktualnie zalogowanym użytkowniku
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Niezalogowany" });
    }
    
    const user = req.user;
    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      isClient: user.isClient,
      isAdmin: user.isAdmin
    });
  });

  // Endpoint zmiany hasła
  app.post("/api/user/change-password", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Niezalogowany" });
    }

    try {
      const { oldPassword, newPassword } = clientPasswordChangeSchema.parse(req.body);
      const user = await storage.getUser(req.user.id);

      if (!user) {
        return res.status(404).json({ error: "Użytkownik nie znaleziony" });
      }

      // Weryfikuj stare hasło
      if (!(await comparePasswords(oldPassword, user.password))) {
        return res.status(400).json({ error: "Niepoprawne aktualne hasło" });
      }

      // Aktualizuj hasło
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(user.id, { password: hashedPassword });

      res.status(200).json({ message: "Hasło zostało zmienione" });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors });
      }
      next(error);
    }
  });

  // Funkcja pomocnicza do sprawdzania czy użytkownik jest zalogowany
  app.use('/api/client', (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Niezalogowany" });
    }
    if (!req.user.isClient && !req.user.isAdmin) {
      return res.status(403).json({ error: "Brak uprawnień" });
    }
    next();
  });

  // Pobierz modele klienta
  app.get("/api/client/models", async (req, res, next) => {
    try {
      // Pobierz modele dla zalogowanego klienta
      const models = await storage.getModelsByClientId(req.user.id);
      
      // Dodaj modele udostępnione przez email
      if (req.user.email) {
        const sharedModels = await storage.getModelsByEmail(req.user.email);
        // Połącz i usuń duplikaty
        const allModels = [...models];
        for (const model of sharedModels) {
          if (!allModels.some(m => m.id === model.id)) {
            allModels.push(model);
          }
        }
        return res.json(allModels);
      }
      
      return res.json(models);
    } catch (error) {
      next(error);
    }
  });

  // Aktualizacja modelu klienta
  app.patch("/api/client/models/:id", async (req, res, next) => {
    try {
      const modelId = parseInt(req.params.id, 10);
      
      // Pobierz model
      const model = await storage.getModel(modelId);
      if (!model) {
        return res.status(404).json({ error: "Model nie istnieje" });
      }
      
      // Sprawdź uprawnienia
      if (model.userId !== req.user.id && model.shareEmail !== req.user.email) {
        return res.status(403).json({ error: "Brak uprawnień do edycji modelu" });
      }
      
      // Aktualizuj model
      const updatedModel = await storage.updateModel(modelId, req.body);
      return res.json(updatedModel);
    } catch (error) {
      next(error);
    }
  });

  // Usunięcie modelu klienta
  app.delete("/api/client/models/:id", async (req, res, next) => {
    try {
      const modelId = parseInt(req.params.id, 10);
      
      // Pobierz model
      const model = await storage.getModel(modelId);
      if (!model) {
        return res.status(404).json({ error: "Model nie istnieje" });
      }
      
      // Sprawdź uprawnienia
      if (model.userId !== req.user.id && model.shareEmail !== req.user.email) {
        return res.status(403).json({ error: "Brak uprawnień do usunięcia modelu" });
      }
      
      // Usuń model
      await storage.deleteModel(modelId);
      return res.status(200).json({ message: "Model został usunięty" });
    } catch (error) {
      next(error);
    }
  });

  // Zmiana hasła udostępnionego modelu
  app.post("/api/client/shared-models/:id/password", async (req, res, next) => {
    try {
      const modelId = parseInt(req.params.id, 10);
      const { password } = req.body;
      
      // Pobierz model
      const model = await storage.getModel(modelId);
      if (!model) {
        return res.status(404).json({ error: "Model nie istnieje" });
      }
      
      // Sprawdź uprawnienia
      if (model.userId !== req.user.id && model.shareEmail !== req.user.email) {
        return res.status(403).json({ error: "Brak uprawnień do zmiany hasła modelu" });
      }
      
      // Haszuj hasło jeśli podano
      let sharePassword = null;
      if (password) {
        sharePassword = await hashPassword(password);
      }
      
      // Aktualizuj model
      const updatedModel = await storage.updateModel(modelId, { sharePassword });
      return res.json({
        id: updatedModel.id,
        hasPassword: !!sharePassword
      });
    } catch (error) {
      next(error);
    }
  });
}