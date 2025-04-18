import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { compareSync, hashSync, genSaltSync } from "bcryptjs";
import { storage } from "./storage";
import { User } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { nanoid } from "nanoid";

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string | null;
      email: string;
      fullName: string | null;
      company: string | null;
      isAdmin: boolean;
      isClient: boolean;
    }
  }
}

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  const salt = genSaltSync(SALT_ROUNDS);
  return hashSync(password, salt);
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  return compareSync(supplied, stored);
}

export function setupAuth(app: Express): void {
  // Użyj PostgreSQL do przechowywania sesji
  const PostgresSessionStore = connectPg(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || nanoid(), // Używaj zmiennej środowiskowej lub generuj losowy sekret
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dni
      sameSite: 'lax'
    },
    store: new PostgresSessionStore({
      pool,
      tableName: 'session', // Tabela automatycznie utworzona przez connect-pg-simple
      createTableIfMissing: true
    })
  };

  // Konfiguracja sesji
  app.use(session(sessionSettings));
  
  // Inicjalizacja Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Strategia logowania lokalnego
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      // Próbujemy znaleźć użytkownika po emailu
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Jeśli nie znaleziono użytkownika po emailu, sprawdzamy czy to nie jest logowanie przez nazwę użytkownika (dla administratora)
        const adminUser = await storage.getUserByUsername(email);
        
        if (!adminUser) {
          return done(null, false, { message: "Nieprawidłowy email lub hasło" });
        }
        
        // Sprawdzamy hasło dla administratora logującego się przez nazwę użytkownika
        const isMatch = await comparePasswords(password, adminUser.password);
        
        if (!isMatch) {
          return done(null, false, { message: "Nieprawidłowy email lub hasło" });
        }
        
        // Aktualizacja daty ostatniego logowania dla admina
        await storage.updateUser(adminUser.id, {
          lastLogin: new Date()
        });
        
        return done(null, {
          id: adminUser.id,
          username: adminUser.username,
          email: adminUser.email,
          fullName: adminUser.fullName,
          company: adminUser.company,
          isAdmin: Boolean(adminUser.isAdmin),
          isClient: Boolean(adminUser.isClient)
        });
      }
      
      // Sprawdzamy hasło dla użytkownika logującego się przez email
      const isMatch = await comparePasswords(password, user.password);
      
      if (!isMatch) {
        return done(null, false, { message: "Nieprawidłowy email lub hasło" });
      }
      
      // Aktualizacja daty ostatniego logowania
      await storage.updateUser(user.id, { 
        lastLogin: new Date() 
      });
      
      return done(null, {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        company: user.company,
        isAdmin: Boolean(user.isAdmin),
        isClient: Boolean(user.isClient)
      });
    } catch (error) {
      return done(error);
    }
  }));

  // Serializacja i deserializacja użytkownika
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      
      return done(null, {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        company: user.company,
        isAdmin: Boolean(user.isAdmin),
        isClient: Boolean(user.isClient)
      });
    } catch (error) {
      return done(error);
    }
  });

  // Middleware do sprawdzania czy użytkownik jest zalogowany
  function isAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
      return next();
    }
    return res.status(401).json({ error: "Niezalogowany" });
  }

  // Middleware do sprawdzania czy użytkownik jest adminem
  function isAdmin(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated() && req.user.isAdmin) {
      return next();
    }
    return res.status(403).json({ error: "Brak dostępu" });
  }

  // Middleware do sprawdzania czy użytkownik jest klientem
  function isClient(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated() && req.user.isClient) {
      return next();
    }
    return res.status(403).json({ error: "Brak dostępu" });
  }

  // Rejestracja endpointów autentykacji
  
  // Endpoint rejestracji użytkownika
  app.post("/api/register", async (req, res) => {
    try {
      const { username, password, email, fullName, company } = req.body;
      
      // Email jest teraz głównym identyfikatorem i jest wymagany
      if (!email) {
        return res.status(400).json({ error: "Email jest wymagany" });
      }

      // Sprawdź czy email jest już użyty
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email jest już używany" });
      }
      
      // Sprawdź czy użytkownik o takiej nazwie już istnieje (opcjonalne)
      if (username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          return res.status(400).json({ error: "Użytkownik o takiej nazwie już istnieje" });
        }
      }
      
      // Hashuj hasło i twórz użytkownika
      const hashedPassword = await hashPassword(password);
      
      const user = await storage.createUser({
        email, // Email jest teraz głównym identyfikatorem
        username, // Username jest opcjonalny
        password: hashedPassword,
        fullName,
        company,
        isAdmin: false,
        isClient: true
      });
      
      // Zaloguj użytkownika po rejestracji
      req.login({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        company: user.company,
        isAdmin: Boolean(user.isAdmin),
        isClient: Boolean(user.isClient)
      }, err => {
        if (err) {
          return res.status(500).json({ error: "Błąd logowania po rejestracji" });
        }
        return res.status(201).json({
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          isAdmin: Boolean(user.isAdmin),
          isClient: Boolean(user.isClient)
        });
      });
    } catch (error) {
      console.error("Błąd rejestracji:", error);
      return res.status(500).json({ error: "Błąd serwera podczas rejestracji" });
    }
  });
  
  // Endpoint logowania
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Błąd logowania" });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json(user);
      });
    })(req, res, next);
  });
  
  // Endpoint wylogowania
  app.post("/api/logout", (req, res) => {
    req.logout(err => {
      if (err) {
        return res.status(500).json({ error: "Błąd wylogowania" });
      }
      res.json({ message: "Wylogowano pomyślnie" });
    });
  });
  
  // Endpoint zwracający informacje o aktualnie zalogowanym użytkowniku
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Niezalogowany" });
    }
    res.json(req.user);
  });
  
  // Endpoint do sprawdzania, czy email istnieje
  app.get("/api/check-email/:email", async (req, res) => {
    try {
      const { email } = req.params;
      
      // Walidacja emaila
      if (!email || !email.includes('@')) {
        return res.status(400).json({ exists: false, error: "Nieprawidłowy adres email" });
      }
      
      // Sprawdź, czy użytkownik o podanym adresie email już istnieje
      const existingUser = await storage.getUserByEmail(email);
      
      // Zwróć tylko informację o istnieniu, bez żadnych danych użytkownika
      res.json({ exists: !!existingUser });
    } catch (error) {
      console.error("Error checking email:", error);
      res.status(500).json({ exists: false, error: "Wystąpił błąd podczas sprawdzania adresu email" });
    }
  });
  
  // Endpoint zmiany hasła
  app.post("/api/user/change-password", isAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // Pobierz użytkownika z bazy
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "Użytkownik nie znaleziony" });
      }
      
      // Sprawdź czy aktualne hasło jest poprawne
      const isMatch = await comparePasswords(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Aktualne hasło jest niepoprawne" });
      }
      
      // Hashuj nowe hasło
      const hashedPassword = await hashPassword(newPassword);
      
      // Aktualizuj hasło w bazie
      await storage.updateUser(user.id, { password: hashedPassword });
      
      res.json({ message: "Hasło zostało zmienione" });
    } catch (error) {
      console.error("Błąd zmiany hasła:", error);
      res.status(500).json({ error: "Błąd serwera podczas zmiany hasła" });
    }
  });
  
  // Endpointy dla klienta
  app.get("/api/client/models", isClient, async (req, res) => {
    try {
      // Pobierz modele klienta
      const models = await storage.getModelsByClientId(req.user.id);
      res.json(models);
    } catch (error) {
      console.error("Błąd pobierania modeli klienta:", error);
      res.status(500).json({ error: "Błąd serwera podczas pobierania modeli" });
    }
  });
  
  // Zmiana hasła udostępnionego modelu
  app.post("/api/client/shared-models/:id/password", isClient, async (req, res) => {
    try {
      const modelId = parseInt(req.params.id);
      const { password } = req.body;
      
      // Sprawdź czy model istnieje i należy do tego klienta
      const model = await storage.getModel(modelId);
      if (!model) {
        return res.status(404).json({ error: "Model nie znaleziony" });
      }
      
      // Sprawdź czy model należy do zalogowanego klienta
      if (model.userId !== req.user.id) {
        return res.status(403).json({ error: "Brak dostępu do tego modelu" });
      }
      
      // Aktualizuj hasło (lub usuń jeśli puste)
      const updatedModel = await storage.updateModel(modelId, { 
        sharePassword: password ? await hashPassword(password) : null 
      });
      
      res.json({ message: "Hasło modelu zaktualizowane", hasPassword: !!password });
    } catch (error) {
      console.error("Błąd aktualizacji hasła modelu:", error);
      res.status(500).json({ error: "Błąd serwera podczas aktualizacji hasła" });
    }
  });
  
  // Usuwanie modelu klienta
  app.delete("/api/client/models/:id", isClient, async (req, res) => {
    try {
      const modelId = parseInt(req.params.id);
      
      // Sprawdź czy model istnieje i należy do tego klienta
      const model = await storage.getModel(modelId);
      if (!model) {
        return res.status(404).json({ error: "Model nie znaleziony" });
      }
      
      // Sprawdź czy model należy do zalogowanego klienta
      if (model.userId !== req.user.id) {
        return res.status(403).json({ error: "Brak dostępu do tego modelu" });
      }
      
      // Usuń model
      const result = await storage.deleteModel(modelId);
      
      if (result) {
        res.json({ message: "Model został usunięty" });
      } else {
        res.status(500).json({ error: "Błąd usuwania modelu" });
      }
    } catch (error) {
      console.error("Błąd usuwania modelu:", error);
      res.status(500).json({ error: "Błąd serwera podczas usuwania modelu" });
    }
  });
  
  // Eksportujemy middleware do użycia w innych plikach
  app.locals.auth = {
    isAuthenticated,
    isAdmin,
    isClient
  };
}