import mongoose from 'mongoose';


export interface RoleModel {
    _id: mongoose.Types.ObjectId;
    name: string;
    color: string;
    group: Schema.Types.ObjectId;
    permissions: string[];
}

const roleSchema = new mongoose.Schema<RoleModel>({
    name: {
        type: String,
        required: [true, 'You must specify the role name'],
        unique: true,
        trim: true,
        maxLength: [32, 'The length of the role name cannot be greater than 32'],
    },
    color: {
        type: String,
        validate: {
            validator: function (s: string) {
                return /^#[0-9A-F]{6}$/i.test(s);
            },
        },
        default: '#ffffff',
    },
    group: {
        type: Schema.Types.ObjectId,
        default: '62ba8ef3e5ba8885e2bffb41',
    },

    permissions: [String],
});

const Role = mongoose.model('Role', roleSchema);

export default Role;
