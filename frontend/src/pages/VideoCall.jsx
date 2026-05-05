import React, { useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { AuthContext } from '../context/AuthContext';

const VideoCall = () => {
    const { roomId } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Bouncer: If they aren't logged in, kick them out
    useEffect(() => {
        if (!user) navigate('/');
    }, [user, navigate]);

    if (!user) return null;

    return (
        <div style={{ height: 'calc(100vh - 65px)', width: '100%', background: '#1a1a1a' }}>
            <JitsiMeeting
                domain="meet.jit.si"
                roomName={roomId}
                userInfo={{
                    displayName: user.name || user.email
                }}
                configOverwrite={{
                    startWithAudioMuted: true,
                    startWithVideoMuted: false,
                    disableModeratorIndicator: true,
                    startScreenSharing: false,
                    enableEmailInStats: false
                }}
                interfaceConfigOverwrite={{
                    DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                    SHOW_CHROME_EXTENSION_BANNER: false
                }}
                getIFrameRef={(iframeRef) => { iframeRef.style.height = '100%'; iframeRef.style.width = '100%'; }}
                onReadyToClose={() => {
                    // When they click the red "Hang Up" button, send them back to their respective dashboard
                    const role = localStorage.getItem('userRole');
                    if (role === 'ALUMNI') navigate('/alumni-dashboard/manage');
                    else navigate('/student-dashboard/upcoming');
                }}
            />
        </div>
    );
};

export default VideoCall;