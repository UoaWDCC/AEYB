import { ReactElement } from 'react';
import { Profile, UserStatus, Roles } from './Interface';
import NavBar from '../components/navigation_bar.js';
import NotifBar from '../components/notification_bar.js';
import React, { useState } from 'react';

interface ProfileInformation {
    profile: Profile;
}

const ProfileInfo = (props: ProfileInformation): ReactElement => {
    // updates the status during onclick events
    const [status, setStatus] = React.useState<UserStatus>(UserStatus.Idle);
    // makes the nsub navigation for setStatus visibile during an on click event
    const [editClick, setEdit] = React.useState(false);

    return (
        <div>
            <div className="mainbody">
                <NavBar/> 
                <NotifBar/>
            </div>
        </div>
    );
};

export default ProfileInfo;
