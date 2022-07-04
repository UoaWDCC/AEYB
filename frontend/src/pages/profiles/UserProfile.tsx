import './UserProfile.css';
import ProfileInfo from './ProfileInfo';
import { UserStatus, Roles } from './Interface';

// dummy data for user page
let profileList = {
    profilePictureUrl:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVsnxFu-un8fqA5jQRLW9XCTF8L8dYg1WO_w&usqp=CAU',
    name: 'Nicole Lorrence',

    status: UserStatus.Idle,
    roles: [Roles.TeamLeader, Roles.Member, Roles.BoardLeader],
};

function UserProfile() {
    return <ProfileInfo profile={profileList} />;
}

export default UserProfile;
