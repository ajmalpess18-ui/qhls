import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Building2, MapPin, Users, BookOpen,
  ClipboardList, FileText, Megaphone, BarChart2, LogOut,
  GraduationCap, CalendarCheck, Download, User
} from 'lucide-react';

const navConfig = {
  admin: [
    { label: 'Dashboard', icon: LayoutDashboard, tab: 'dashboard' },
    { label: 'States',    icon: MapPin,          tab: 'states'    },
    { label: 'Districts', icon: Building2,       tab: 'districts' },
    { label: 'Users',     icon: Users,           tab: 'users'     },
    { label: 'Analytics', icon: BarChart2,       tab: 'analytics' },
  ],
  state: [
    { label: 'Dashboard',    icon: LayoutDashboard, tab: 'dashboard'    },
    { label: 'Districts',    icon: Building2,       tab: 'districts'    },
    { label: 'Submissions',  icon: ClipboardList,   tab: 'submissions'  },
    { label: 'Results',      icon: FileText,        tab: 'results'      },
    { label: 'Materials',    icon: BookOpen,        tab: 'materials'    },
    { label: 'Announcements',icon: Megaphone,       tab: 'announcements'},
    { label: 'Users',        icon: Users,           tab: 'users'        },
  ],
  district: [
    { label: 'Dashboard',   icon: LayoutDashboard, tab: 'dashboard'   },
    { label: 'Zones',       icon: MapPin,          tab: 'zones'       },
    { label: 'Units',       icon: Building2,       tab: 'units'       },
    { label: 'Zone Admins', icon: Users,           tab: 'users'       },
    { label: 'Submissions', icon: ClipboardList,   tab: 'submissions' },
  ],
  zone: [
    { label: 'Dashboard',   icon: LayoutDashboard, tab: 'dashboard'   },
    { label: 'Units',       icon: Building2,       tab: 'units'       },
    { label: 'Unit Admins', icon: Users,           tab: 'users'       },
    { label: 'Submissions', icon: ClipboardList,   tab: 'submissions' },
  ],
  unit: [
    { label: 'Dashboard',   icon: LayoutDashboard, tab: 'dashboard'   },
    { label: 'Centers',     icon: Building2,       tab: 'centers'     },
    { label: 'Students',    icon: GraduationCap,   tab: 'students'    },
    { label: 'Faculty',     icon: Users,           tab: 'faculty'     },
    { label: 'Attendance',  icon: CalendarCheck,   tab: 'attendance'  },
    { label: 'Submissions', icon: ClipboardList,   tab: 'submissions' },
  ],
  faculty: [
    { label: 'Dashboard', icon: LayoutDashboard, tab: 'dashboard' },
    { label: 'My Center', icon: Building2,       tab: 'center'    },
  ],
  student: [
    { label: 'Dashboard',   icon: LayoutDashboard, tab: 'dashboard'   },
    { label: 'Profile',     icon: User,            tab: 'profile'     },
    { label: 'Results',     icon: FileText,        tab: 'results'     },
    { label: 'Attendance',  icon: CalendarCheck,   tab: 'attendance'  },
    { label: 'Materials',   icon: Download,        tab: 'materials'   },
  ],
};

const roleLabels = {
  admin: 'Administrator', state: 'State Admin',
  district: 'District Admin', zone: 'Zone Admin',
  unit: 'Unit Admin', faculty: 'Faculty', student: 'Student',
};

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = navConfig[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    if (setIsOpen) setIsOpen(false);
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">Q</div>
        <div>
          <div className="logo-text">QHLS</div>
          <div className="logo-sub">{roleLabels[user?.role]}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map(({ label, icon: Icon, tab }) => (
          <div
            key={tab}
            className={`nav-item ${activeTab === tab ? 'active' : ''}`}
            onClick={() => handleNavClick(tab)}
          >
            <Icon size={17} />
            <span>{label}</span>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="btn btn-outline btn-sm btn-full" onClick={handleLogout}>
          <LogOut size={15} /> Logout
        </button>
      </div>
    </aside>
  );
}
