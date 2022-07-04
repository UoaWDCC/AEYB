import { ReactElement } from 'react';
import IonIcon from '@reacticons/ionicons'; 
import React, { useState } from 'react';

const NotifBar = () =>{
    const [show,setShow] = useState(false); 
    const [notify,setNotify] = useState(true);
    return(
        <div className='absolute right-4 top-4 text-right inline-flex gap-x-3'>
            <div className={`${show? "block":"hidden"} w-96 h-72 bg-blue-200 shadow-lg`}></div>
            <div>
                <span className={`${notify&&!show? "block":"hidden"} animate-ping absolute inline-flex h-4 w-4 rounded-full bg-red-600 opacity-75`}></span>
                <span className={`${notify? "block":"hidden"} absolute inline-flex rounded-full h-3 w-3 bg-red-700`}></span>
                <IonIcon name='notifications' size='large' className='text-blue-800 cursor-pointer' onClick={()=>setShow(!show)}/>
            </div>
        </div>
    );
}

export default NotifBar;