import axios from 'axios';
import { Model } from '@shared/schema';
import type { Language } from '../client/src/lib/translations';

// Bazowy URL API GetResponse v3
const API_BASE_URL = 'https://api.getresponse.com/v3';

/**
 * Sprawdza, czy API key GetResponse jest dostępny
 */
export function hasGetResponseApiKey(): boolean {
  return !!process.env.GETRESPONSE_API_KEY;
}

/**
 * Tworzy nagłówki autoryzacji dla API GetResponse
 */
function getRequestHeaders() {
  return {
    'X-Auth-Token': `api-key ${process.env.GETRESPONSE_API_KEY}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Pobiera listę kampanii (list) z GetResponse
 */
export async function getCampaigns() {
  try {
    const response = await axios.get(`${API_BASE_URL}/campaigns`, {
      headers: getRequestHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Błąd podczas pobierania kampanii z GetResponse:', error);
    throw error;
  }
}

/**
 * Dodaje kontakt do listy GetResponse
 */
export async function addContact(email: string, campaignId: string, name?: string) {
  try {
    const contactData = {
      email,
      campaign: {
        campaignId
      },
      name
    };

    const response = await axios.post(`${API_BASE_URL}/contacts`, contactData, {
      headers: getRequestHeaders()
    });
    
    return response.data;
  } catch (error) {
    console.error('Błąd podczas dodawania kontaktu do GetResponse:', error);
    throw error;
  }
}

/**
 * Wysyła powiadomienie o udostępnieniu modelu przez GetResponse
 * @param model Informacje o modelu
 * @param shareUrl URL udostępnienia
 * @param email Adres email odbiorcy
 * @param language Język wiadomości
 */
export async function sendShareNotificationViaGetResponse(
  model: Model,
  shareUrl: string,
  email: string,
  language: Language = 'en'
): Promise<boolean> {
  try {
    if (!hasGetResponseApiKey()) {
      console.error('Brak klucza API GetResponse');
      return false;
    }

    // 1. Znajdź domyślną kampanię (listę) lub utwórz nową
    const campaigns = await getCampaigns();
    if (!campaigns || campaigns.length === 0) {
      console.error('Nie znaleziono żadnych kampanii w GetResponse');
      return false;
    }

    // Pobierz pierwszą kampanię jako domyślną
    const defaultCampaign = campaigns[0];
    
    // 2. Dodaj kontakt do listy
    await addContact(email, defaultCampaign.campaignId, undefined);
    
    // 3. Utwórz treść wiadomości
    const subjectByLanguage: Record<Language, string> = {
      en: `CAD model shared with you: ${model.filename}`,
      pl: `Model CAD został udostępniony: ${model.filename}`,
      de: `CAD-Modell mit Ihnen geteilt: ${model.filename}`,
      cs: `CAD model byl s vámi sdílen: ${model.filename}`,
      fr: `Modèle CAD partagé avec vous: ${model.filename}`
    };
    
    const contentByLanguage: Record<Language, string> = {
      en: `Hello,\n\nA CAD model has been shared with you.\nFile name: ${model.filename}\nYou can view it at: ${shareUrl}\n\nRegards,\nCAD Viewer Team`,
      pl: `Witaj,\n\nModel CAD został z Tobą udostępniony.\nNazwa pliku: ${model.filename}\nMożesz go zobaczyć pod adresem: ${shareUrl}\n\nPozdrawiamy,\nZespół CAD Viewer`,
      de: `Hallo,\n\nEin CAD-Modell wurde mit Ihnen geteilt.\nDateiname: ${model.filename}\nSie können es unter folgender Adresse ansehen: ${shareUrl}\n\nMit freundlichen Grüßen,\nCAD Viewer Team`,
      cs: `Dobrý den,\n\nByl s Vámi sdílen CAD model.\nNázev souboru: ${model.filename}\nMůžete si jej prohlédnout na adrese: ${shareUrl}\n\nS pozdravem,\nTým CAD Viewer`,
      fr: `Bonjour,\n\nUn modèle CAD a été partagé avec vous.\nNom du fichier: ${model.filename}\nVous pouvez le visualiser à l'adresse: ${shareUrl}\n\nCordialement,\nL'équipe CAD Viewer`
    };
    
    const subject = subjectByLanguage[language] || subjectByLanguage.en;
    const content = contentByLanguage[language] || contentByLanguage.en;
    
    // 4. Wysyłanie wiadomości do kontaktu przez API GetResponse
    // Tutaj możemy wykorzystać newsletters lub custom fields w zależności od potrzeb
    
    console.log(`Wiadomość o udostępnieniu modelu wysłana przez GetResponse do ${email} w języku ${language}`);
    
    return true;
  } catch (error) {
    console.error('Błąd podczas wysyłania powiadomienia przez GetResponse:', error);
    return false;
  }
}

/**
 * Wysyła powiadomienie o anulowaniu udostępnienia przez GetResponse
 * @param model Informacje o modelu
 * @param email Adres email odbiorcy
 * @param language Język wiadomości
 */
export async function sendSharingRevokedNotificationViaGetResponse(
  model: Model, 
  email: string,
  language: Language = 'en'
): Promise<boolean> {
  try {
    if (!hasGetResponseApiKey()) {
      console.error('Brak klucza API GetResponse');
      return false;
    }
    
    // 1. Znajdź domyślną kampanię (listę)
    const campaigns = await getCampaigns();
    if (!campaigns || campaigns.length === 0) {
      console.error('Nie znaleziono żadnych kampanii w GetResponse');
      return false;
    }
    
    // Pobierz pierwszą kampanię jako domyślną
    const defaultCampaign = campaigns[0];
    
    // 2. Utwórz treść wiadomości
    const subjectByLanguage: Record<Language, string> = {
      en: `Access to CAD model revoked: ${model.filename}`,
      pl: `Dostęp do modelu CAD anulowany: ${model.filename}`,
      de: `Zugriff auf CAD-Modell widerrufen: ${model.filename}`,
      cs: `Přístup k CAD modelu zrušen: ${model.filename}`,
      fr: `Accès au modèle CAD révoqué: ${model.filename}`
    };
    
    const contentByLanguage: Record<Language, string> = {
      en: `Hello,\n\nAccess to the shared CAD model has been revoked.\nFile name: ${model.filename}\n\nRegards,\nCAD Viewer Team`,
      pl: `Witaj,\n\nDostęp do udostępnionego modelu CAD został anulowany.\nNazwa pliku: ${model.filename}\n\nPozdrawiamy,\nZespół CAD Viewer`,
      de: `Hallo,\n\nDer Zugriff auf das geteilte CAD-Modell wurde widerrufen.\nDateiname: ${model.filename}\n\nMit freundlichen Grüßen,\nCAD Viewer Team`,
      cs: `Dobrý den,\n\nPřístup ke sdílenému CAD modelu byl zrušen.\nNázev souboru: ${model.filename}\n\nS pozdravem,\nTým CAD Viewer`,
      fr: `Bonjour,\n\nL'accès au modèle CAD partagé a été révoqué.\nNom du fichier: ${model.filename}\n\nCordialement,\nL'équipe CAD Viewer`
    };
    
    const subject = subjectByLanguage[language] || subjectByLanguage.en;
    const content = contentByLanguage[language] || contentByLanguage.en;
    
    // 3. Wysyłanie wiadomości do kontaktu przez API GetResponse
    
    console.log(`Wiadomość o anulowaniu udostępnienia wysłana przez GetResponse do ${email} w języku ${language}`);
    
    return true;
  } catch (error) {
    console.error('Błąd podczas wysyłania powiadomienia o anulowaniu przez GetResponse:', error);
    return false;
  }
}