import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IExperience {
  id: string;
  title: string;
  years: number;
  description?: string;
}

export interface IFixerProfile {
  ci: string;
  location?: { lat: number; lng: number };
  services: string[];
  payments: ('cash' | 'qr' | 'card')[];
  accountInfo?: string;
  experiences: IExperience[];
  hasVehicle: boolean;
  vehicleType?: string;
  photoUrl?: string;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  role: 'requester' | 'fixer';
  fixerProfile?: IFixerProfile;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    role: { type: String, enum: ['requester', 'fixer'], default: 'requester' },
    fixerProfile: {
      ci: { type: String },
      location: {
        lat: { type: Number },
        lng: { type: Number },
      },
      services: [{ type: String }],
      payments: [{ type: String, enum: ['cash', 'qr', 'card'] }],
      accountInfo: { type: String },
      experiences: [
        {
          id: { type: String },
          title: { type: String },
          years: { type: Number },
          description: { type: String },
        },
      ],
      hasVehicle: { type: Boolean },
      vehicleType: { type: String },
      photoUrl: { type: String },
    },
  },
  { collection: 'users', timestamps: true },
);

// ⚠️ CORRECCIÓN CLAVE: Exportar el modelo de Mongoose usando el patrón de cacheo
const MODEL_NAME = 'User';

export const UserModel: Model<IUser> =
  (mongoose.models[MODEL_NAME] as Model<IUser>) ||
  mongoose.model<IUser>(MODEL_NAME, UserSchema);

// Exportamos por defecto para facilitar la importación en otros servicios
export default UserModel;

// Exportamos la interfaz IUser ya que se necesita para tipado
// (No es necesario exportar IExperience y IFixerProfile si solo se usan localmente)
export type IFixer = IUser; // Definimos IFixer como un alias de IUser para mantener la convención del código