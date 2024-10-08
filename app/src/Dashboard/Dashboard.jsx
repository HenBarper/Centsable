import React, { useState, useEffect, useContext } from 'react';
import NavBar from '../Navigation/NavBar';
import { BrowserRouter as Router } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import { app } from "../Firebase/firebase.js";
import { getAuth } from 'firebase/auth';
import { doc, getDoc, getFirestore } from "firebase/firestore";
import Home from './Home';
import Search from './Search';
import Donations from './Donations';
import Accounts from './Accounts';
import AdminPage from '../Admin/AdminPage';
import UserDrawer from '../Components/General/UserDrawer';
import TransactionContext from '../Context/TransactionsContext';
import UserContext from '../Context/UserContext.jsx';
// import PlaidContext from '../Context/PlaidContext.jsx';
import AboutUsModal from '../Components/General/AboutUsModal';

// About Us Images
import tayler from '../assets/Tayler.png';
import rob from '../assets/Rob.png';
import ben from '../assets/Ben.png';
import sloane from '../assets/Sloane.png';
import shadi from '../assets/Shadi.png';

const Dashboard = () => {
  const [isNavBarOpen, setIsNavBarOpen] = useState(true);
  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false);
  const [selectedNavItem, setSelectedNavItem] = useState('Home');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAboutUsModalOpen, setIsAboutUsModalOpen] = useState(false);
  const [aboutUsData, setAboutUsData] = useState({});

  const toggleAboutUsModal = (data) => {
    setAboutUsData(data);
    setIsAboutUsModalOpen(!isAboutUsModalOpen);
  };

  const mainSiteAboutData = {
    aboutUsTitle: "Thanks for checking out Centsable!",
    teamPhotos: [
      {
        name: "Tayler Coon",
        role: "Design & Front End",
        image: tayler,
        linkedIn: "https://www.linkedin.com/in/taylercoon/"
      },
      {
        name: "Robert Farley",
        role: "Back End",
        image: rob,
        linkedIn: "https://www.linkedin.com/in/robertfarley89/"
      },
      {
        name: "Benjamin Harper",
        role: "Database & Full Stack",
        image: ben,
        linkedIn: "https://www.linkedin.com/in/ben-harper-webdev/"
      },
      {
        name: "Sloane Markland",
        role: "Project Manager",
        image: sloane,
        linkedIn: "https://www.linkedin.com/in/sloanemarkland/"
      },
      {
        name: "Shadi Shwiyat",
        role: "Security & Performance",
        image: shadi,
        linkedIn: "https://www.linkedin.com/in/shadi-the-programmer/"
      }
    ],
    aboutUsText: [
      "Hey there! Thanks for checking out our project.",
      
      "Centsable was started as a Capstone project by five Full Stack students from Atlas School Tulsa. In four short weeks, we went through the process of brainstorming, identifying a viable idea, narrowing scope, programming execution, and ended with a great base for a potential startup application.",
      
      "Centsable is an app that can be used to make small donations to multiple causes regularly, by automatically rounding up purchases and donating the change to pre-selected content creators or various other organizations. We believe this project has the potential for real-world development and intend to seek backers to help us see through its potential.",
    ],
  };

  // const {
  //   linked_accounts,
  // } = useContext(PlaidContext);

  const {
    setTransactions,
    setTransactionsLoaded,
  } = useContext(TransactionContext);

  const {
    recipientPreference,
    recipientsLoaded,
    setRecipientPreference,
    setRecipientsLoaded,
  } = useContext(UserContext);

  // Instantiate firebase auth
  const auth = getAuth(app);
  const db = getFirestore(app);

  // Runs once on user log in to retrieve recent transactions from plaid api
  useEffect(() => {
    const getUserTransactions = async () => {
      const path = 'https://us-central1-centsable-6f179.cloudfunctions.net/getUserTransactions';

      try {
        const currentUser = auth.currentUser;

        if (currentUser) {
          const idToken = await currentUser.getIdToken();

          const response = await fetch(path, {
            method: "POST",
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              uid: currentUser.uid,
            }),
          });

          if (!response.ok) {
            setTransactions({});
            setTransactionsLoaded(false);
            const errorData = await response.json();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
          }

          const data = await response.json();
          if (!data) {
            setTransactions({});
            setTransactionsLoaded(false);
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          setTransactions(data);
          setTransactionsLoaded(true);
        } else {
          throw new Error('No current user found');
        }
      } catch (err) {
        console.log('There was an error fetching user transaction history:', err);
      }
    };

    getUserTransactions();
  }, []);

  // Checks current user recipient preference and loads into context
  useEffect(() => {
    const getRecipientsForUser = async () => {
      const path = 'https://us-central1-centsable-6f179.cloudfunctions.net/getRecipientsForUser';

      try {
        const currentUser = auth.currentUser;

        if (currentUser) {
          const idToken = await currentUser.getIdToken();

          const response = await fetch(path, {
            method: "POST",
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              uid: currentUser.uid,
            }),
          });

          if (!response.ok) {
            setRecipientPreference([]);
            setRecipientsLoaded(true);
            const errorData = await response.json();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
          }

          const data = await response.json();
          if (!data) {
            setRecipientPreference([]);
            setRecipientsLoaded(true);
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          // console.log(data);
          setRecipientPreference(data.current_recipients);
          setRecipientsLoaded(true);
          // console.log(recipientPreference);
        } else {
          throw new Error('No current user found');
        }
      } catch (err) {
        console.log('There was an error fetching user recipient preferences', err);
      }
    };

    getRecipientsForUser();
  }, []);

  // Check if the user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const currentUser = auth.currentUser;

        if (currentUser) {
          const idToken = await currentUser.getIdToken();

          const userRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists() && userDoc.data().admin) {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.log('Error checking admin status:', error);
      }
    };

    checkAdminStatus();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleNavBar = () => {
    setIsNavBarOpen(!isNavBarOpen);
  };

  const toggleUserDrawer = () => {
    setIsUserDrawerOpen(!isUserDrawerOpen);
  };

  return (
    <Router>
      <div className="flex h-screen overflow-hidden">
        <NavBar
          isOpen={isNavBarOpen}
          toggleNavBar={toggleNavBar}
          isUserDrawerOpen={isUserDrawerOpen}
          toggleUserDrawer={toggleUserDrawer}
          selectedItem={selectedNavItem}
          setSelectedItem={setSelectedNavItem}
          isAdmin={isAdmin}
        />
        <main className={`
          flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 transition-all duration-300 min-h-screen
          ${isMobile ? 'mt-16' : (isNavBarOpen ? 'md:ml-64' : 'md:ml-20')}
        `}>
          <div className="relative">
            <div className="absolute top-4 left-6 z-10">
              <button
                onClick={() => toggleAboutUsModal(mainSiteAboutData)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                About Centsable
              </button>
            </div>
          </div>
          <div className="pt-16"> {/* Add padding to prevent content from being hidden behind the button */}
            <Routes>
              <Route path="/" element={<Home isUserDrawerOpen={isUserDrawerOpen} setSelectedNavItem={setSelectedNavItem} isMobile={isMobile} />} />
              <Route path="/home" element={<Home isUserDrawerOpen={isUserDrawerOpen} setSelectedNavItem={setSelectedNavItem} isMobile={isMobile} />} />
              <Route path="/search" element={<Search isUserDrawerOpen={isUserDrawerOpen} isMobile={isMobile} />} />
              <Route path="/donations" element={<Donations isUserDrawerOpen={isUserDrawerOpen} />} />
              <Route path="/accounts" element={<Accounts isUserDrawerOpen={isUserDrawerOpen} isMobile={isMobile} />} />
              {isAdmin && <Route path="/admin" element={<AdminPage />} />}
            </Routes>
          </div>
        </main>
        <AboutUsModal
          isOpen={isAboutUsModalOpen}
          onClose={() => setIsAboutUsModalOpen(false)}
          data={mainSiteAboutData}
        />
      </div>
    </Router>
  );
};

export default Dashboard;