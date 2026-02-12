import React, { useEffect, useRef } from 'react';

const ContextMenu = ({ x, y, items, onClose }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        const handleScroll = () => onClose();

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEsc);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEsc);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [onClose]);

    // Adjust position so menu doesn't overflow viewport
    useEffect(() => {
        if (menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            if (rect.right > vw) {
                menuRef.current.style.left = `${x - rect.width}px`;
            }
            if (rect.bottom > vh) {
                menuRef.current.style.top = `${y - rect.height}px`;
            }
        }
    }, [x, y]);

    return (
        <div
            ref={menuRef}
            style={{
                position: 'fixed',
                top: y,
                left: x,
                zIndex: 9999,
                minWidth: '180px',
                padding: '6px',
                borderRadius: '12px',
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(48, 251, 230, 0.05)',
                animation: 'contextMenuFadeIn 0.12s ease-out'
            }}
        >
            {items.map((item, index) => {
                if (item.divider) {
                    return (
                        <div
                            key={`divider-${index}`}
                            style={{
                                height: '1px',
                                background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1), transparent)',
                                margin: '4px 8px'
                            }}
                        />
                    );
                }

                return (
                    <button
                        key={index}
                        onClick={() => {
                            item.onClick?.();
                            onClose();
                        }}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'transparent',
                            color: item.color || 'rgba(255, 255, 255, 0.85)',
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'background 0.12s',
                            textAlign: 'left',
                            fontFamily: "'Inter', sans-serif"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = item.color
                                ? `${item.color}15`
                                : 'rgba(255, 255, 255, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                        }}
                    >
                        {item.icon && (
                            <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                                {item.icon}
                            </span>
                        )}
                        <span>{item.label}</span>
                    </button>
                );
            })}

            <style>{`
                @keyframes contextMenuFadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            `}</style>
        </div>
    );
};

export default ContextMenu;
