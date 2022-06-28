import mongoose from 'mongoose';
import Role from './RoleModel';

export interface GroupModel {
    _id: mongoose.Types.ObjectId;
    name: string;
    color: string;
}

const groupSchema = new mongoose.Schema<GroupModel>({
    name: {
        type: String,
        required: [true, 'You must specify the group name'],
        unique: true,
        trim: true,
        maxLength: [32, 'The length of the group name cannot be greater than 32'],
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
});

const Group = mongoose.model('Group', groupSchema);

export default Group;
