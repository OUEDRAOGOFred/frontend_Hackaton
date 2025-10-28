import React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import CalendarIntegration from './pages/CalendarIntegration';
import CoursesPage from './pages/CoursesPage';
import AssignmentsPage from './pages/AssignmentsPage';
import GradesPage from './pages/GradesPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navigation />
          <Switch>
            <Route path="/" exact component={Home} />
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <PrivateRoute 
              path="/admin" 
              component={AdminDashboard} 
              roles={['admin']}
            />
            <PrivateRoute 
              path="/teacher" 
              component={TeacherDashboard} 
              roles={['teacher']}
            />
            <PrivateRoute 
              path="/student" 
              component={StudentDashboard} 
              roles={['student']}
            />
            <PrivateRoute 
              path="/calendar" 
              component={CalendarIntegration} 
            />
            <PrivateRoute 
              path="/courses" 
              component={CoursesPage} 
            />
            <PrivateRoute 
              path="/assignments" 
              component={AssignmentsPage} 
            />
            <PrivateRoute 
              path="/grades" 
              component={GradesPage} 
            />
            <Redirect to="/login" />
          </Switch>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;