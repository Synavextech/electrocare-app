declare module 'bcryptjs' {
    export function hash(password: string, salt: number): Promise<string>;
    export function compare(password: string, hash: string): Promise<boolean>;
    // Add more if needed (e.g., genSalt)
  }
  
  declare module 'nodemailer' {
    import { Transporter } from 'nodemailer';  // Basic
    export function createTransport(options: any): Transporter;
    // Expand as needed for sendMail, etc.
  }