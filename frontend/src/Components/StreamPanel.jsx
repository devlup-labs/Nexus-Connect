import React, { useState } from 'react';
import { AppWindow, MoreHorizontal, Play, Eye, Share2, Bookmark, Flag, RefreshCw, PlusCircle, Trash2 } from 'lucide-react';
import ContextMenu from './ContextMenu';
import './StreamPanel.css';

const StreamPanel = () => {
    const [activeCard, setActiveCard] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);

    const streamItems = [
        {
            id: 1,
            type: 'text',
            userName: 'User Name',
            userAvatar: 'UN',
            title: 'Lorem ipsum dolor sit amet, casetur adipiscing elit, sue nomiro uninat ia...',
            timestamp: '3 hours ago'
        },
        {
            id: 2,
            type: 'text',
            userName: 'Thnoe -Isbert',
            userAvatar: 'TI',
            title: 'The professtive wahepativity of your amount.',
            timestamp: '2 hours ago'
        },
        {
            id: 3,
            type: 'large-media',
            userName: '1 x -mict',
            userAvatar: '1X',
            title: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed transvom',
            timestamp: '7 minutes ago'
        },
        {
            id: 4,
            type: 'text',
            userName: 'Thnoe -Isbert',
            userAvatar: 'TI',
            title: 'Clap matogranics wyinuinals ucts the pawnori.',
            timestamp: '9 hours ago'
        },
        {
            id: 5,
            type: 'audio',
            userName: 'Audio User',
            userAvatar: 'AU',
            timestamp: '2 minutes ago'
        },
        {
            id: 6,
            type: 'small-media',
            userName: '1',
            userAvatar: '1',
            hasAudio: true,
            timestamp: '9 hours ago'
        },
        {
            id: 7,
            type: 'text',
            userName: 'Stephen Hawking',
            userAvatar: 'AC',
            title: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mabala vindilinun ut ceritus umleothoc main.',
            timestamp: '3 minutes ago'
        },
        {
            id: 8,
            type: 'large-media',
            userName: 'Media User',
            userAvatar: 'MU',
            timestamp: '5 minutes ago'
        },
        {
            id: 9,
            type: 'text',
            userName: 'Ruc- Ssehoco',
            userAvatar: 'RS',
            title: 'Lorem ipsum bonupan eodos sit amet,commodir lians eget consecta turmare vitamc in mest kenn lesuis',
            timestamp: '3 minutes ago'
        }
    ];

    const renderCard = (item) => {
        const isActive = item.id === activeCard;

        const CardHeader = () => (
            <div className="card-header">
                <div className="avatar">{item.userAvatar}</div>
                <span className="user-name">{item.userName}</span>
            </div>
        );

        switch (item.type) {
            case 'text':
                return (
                    <div
                        className={`stream-card text-card ${isActive ? 'active' : ''}`}
                        onClick={() => setActiveCard(item.id)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setContextMenu({ x: e.clientX, y: e.clientY, type: 'card', itemId: item.id });
                        }}
                    >
                        <CardHeader />
                        <div className="card-content">
                            <p className="card-text">{item.title}</p>
                            <span className="card-timestamp">{item.timestamp}</span>
                        </div>
                    </div>
                );

            case 'small-media':
                return (
                    <div
                        className={`stream-card small-media-card ${isActive ? 'active' : ''}`}
                        onClick={() => setActiveCard(item.id)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setContextMenu({ x: e.clientX, y: e.clientY, type: 'card', itemId: item.id });
                        }}
                    >
                        <CardHeader />
                        <div className="media-preview">
                            <div className="play-button">
                                <Play size={20} fill="white" />
                            </div>
                            {item.hasAudio && (
                                <div className="audio-indicator">
                                    <div className="waveform-mini">
                                        {[...Array(12)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="wave-bar-mini"
                                                style={{ height: `${Math.random() * 60 + 20}%` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="card-content">
                            <span className="card-timestamp">{item.timestamp}</span>
                        </div>
                    </div>
                );

            case 'audio':
                return (
                    <div
                        className={`stream-card audio-card ${isActive ? 'active' : ''}`}
                        onClick={() => setActiveCard(item.id)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setContextMenu({ x: e.clientX, y: e.clientY, type: 'card', itemId: item.id });
                        }}
                    >
                        <CardHeader />
                        <div className="audio-content">
                            <div className="waveform">
                                {[...Array(20)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="wave-bar"
                                        style={{ height: `${Math.random() * 60 + 20}%` }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="card-content">
                            <span className="card-timestamp">{item.timestamp}</span>
                        </div>
                    </div>
                );

            case 'large-media':
                return (
                    <div
                        className={`stream-card large-media-card ${isActive ? 'active' : ''}`}
                        onClick={() => setActiveCard(item.id)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setContextMenu({ x: e.clientX, y: e.clientY, type: 'card', itemId: item.id });
                        }}
                    >
                        <CardHeader />
                        <div className="large-media-preview">
                            <div className="play-button large">
                                <Play size={28} fill="white" />
                            </div>
                        </div>
                        <div className="card-content">
                            <p className="card-text">{item.title}</p>
                            <span className="card-timestamp">{item.timestamp}</span>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const leftColumnItems = [
        streamItems[0],
        streamItems[2],
        streamItems[4],
        streamItems[6]
    ];

    const rightColumnItems = [
        streamItems[1],
        streamItems[3],
        streamItems[5],
        streamItems[7],
        streamItems[8]
    ];

    return (
        <div className="stream-panel">
            <div className="stream-header">
                <h2 className="stream-title">Stream</h2>
                <div className="header-actions">
                    <button className="icon-button">
                        <AppWindow size={18} />
                    </button>
                    <button className="icon-button">
                        <MoreHorizontal size={18} />
                    </button>
                </div>
            </div>
            <div className="stream-divider"></div>
            <div className="stream-feed-masonry"
                onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, type: 'panel' });
                }}
            >
                <div className="feed-column">
                    {leftColumnItems.map((item) => (
                        <React.Fragment key={item.id}>
                            {renderCard(item)}
                        </React.Fragment>
                    ))}
                </div>
                <div className="feed-column">
                    {rightColumnItems.map((item) => (
                        <React.Fragment key={item.id}>
                            {renderCard(item)}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    items={
                        contextMenu.type === 'card'
                            ? [
                                { label: 'View Chat', icon: <Eye size={16} />, onClick: () => { } },
                                // { label: 'Share', icon: <Share2 size={16} />, onClick: () => { } },
                                { label: 'Archive', icon: <Bookmark size={16} />, onClick: () => { } },
                                { divider: true },
                                { label: 'Report', icon: <Flag size={16} />, color: '#ef4444', onClick: () => { } },
                            ]
                            : [
                                { label: 'Refresh Feed', icon: <RefreshCw size={16} />, onClick: () => { } },
                                { label: 'New Post', icon: <PlusCircle size={16} />, onClick: () => { } },
                            ]
                    }
                />
            )}
        </div>
    );
};

export default StreamPanel;
