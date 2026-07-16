import { Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import CourseList from './pages/CourseList'
import CourseDetail from './pages/CourseDetail'
import LessonDetail from './pages/LessonDetail'
import ComingSoon from './pages/ComingSoon'

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<CourseList />} />
        <Route path="/courses/:courseId" element={<CourseDetail />} />
        <Route path="/lessons/:lessonId" element={<LessonDetail />} />
        <Route path="/dashboard" element={<ComingSoon title="My progress" />} />
        <Route path="/login" element={<ComingSoon title="Sign in" />} />
        <Route path="*" element={<ComingSoon title="Not found" />} />
      </Routes>
      <Footer />
    </>
  )
}
