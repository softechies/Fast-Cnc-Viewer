declare module '@mailchimp/mailchimp_transactional' {
  export interface MailchimpOptions {
    key: string;
    dc?: string;  // Region datacenter (e.g., 'us2')
  }
  
  export default function mailchimp(apiKeyOrOptions: string | MailchimpOptions): {
    users: {
      ping(): Promise<string>;
    };
    messages: {
      send(params: {
        message: {
          from_email: string;
          from_name: string;
          subject: string;
          text: string;
          html: string;
          to: Array<{
            email: string;
            type: string;
          }>;
        };
      }): Promise<Array<{
        status: string;
        _id: string;
        email: string;
        reject_reason: string | null;
      }>>;
    };
  };
}