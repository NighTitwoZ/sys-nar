import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import DepartmentsPage from './pages/DepartmentsPage'
import StructureDetailPage from './pages/StructureDetailPage'
import DepartmentDetailPage from './pages/DepartmentDetailPage'
import DutyTypesPage from './pages/DutyTypesPage'
import DutyDistributionPage from './pages/DutyDistributionPage'
import DutyStructuresPage from './pages/DutyStructuresPage'
import DutySubdepartmentsPage from './pages/DutySubdepartmentsPage'
import DutyTypesByDepartmentPage from './pages/DutyTypesByDepartmentPage'
import SubdepartmentsPage from './pages/SubdepartmentsPage'
import AllDutyTypesPage from './pages/AllDutyTypesPage'
import StructureAllDutyTypesPage from './pages/StructureAllDutyTypesPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/departments/:structureId/subdepartments" element={<SubdepartmentsPage />} />
        <Route path="/departments/:structureId/subdepartments/:departmentId" element={<DepartmentDetailPage />} />
        <Route path="/duty-types" element={<DutyTypesPage />} />
        <Route path="/duty-distribution" element={<DutyDistributionPage />} />
        <Route path="/duty-structures" element={<DutyStructuresPage />} />
        <Route path="/duty-structures/all" element={<AllDutyTypesPage />} />
        <Route path="/duty-structures/:structureId/all" element={<StructureAllDutyTypesPage />} />
        <Route path="/duty-structures/:structureId/subdepartments" element={<DutySubdepartmentsPage />} />
        <Route path="/duty-structures/:structureId/subdepartments/:subdepartmentId/duty-types" element={<DutyTypesByDepartmentPage />} />
      </Routes>
    </Layout>
  )
}

export default App 