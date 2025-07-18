import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import DepartmentsPage from './pages/DepartmentsPage'
import StructureDetailPage from './pages/StructureDetailPage'
import DepartmentDetailPage from './pages/DepartmentDetailPage'
import DepartmentGroupsPage from './pages/DepartmentGroupsPage'
import GroupEmployeesPage from './pages/GroupEmployeesPage'
import DutyTypesPage from './pages/DutyTypesPage'
import DutyDistributionPage from './pages/DutyDistributionPage'
import AcademicDutyPage from './pages/AcademicDutyPage'
import DutyStructuresPage from './pages/DutyStructuresPage'
import DutySubdepartmentsPage from './pages/DutySubdepartmentsPage'
import DutyTypesByDepartmentPage from './pages/DutyTypesByDepartmentPage'
import SubdepartmentsPage from './pages/SubdepartmentsPage'
import AllDutyTypesPage from './pages/AllDutyTypesPage'
import StructureAllDutyTypesPage from './pages/StructureAllDutyTypesPage'
import PersonnelExpensePage from './pages/PersonnelExpensePage'
import PersonnelExpenseSubdepartmentsPage from './pages/PersonnelExpenseSubdepartmentsPage'
import PersonnelExpenseEmployeesPage from './pages/PersonnelExpenseEmployeesPage'
import PersonnelExpenseGroupsPage from './pages/PersonnelExpenseGroupsPage'
import PersonnelExpenseGroupEmployeesPage from './pages/PersonnelExpenseGroupEmployeesPage'
import PersonnelExpenseStructureEmployeesPage from './pages/PersonnelExpenseStructureEmployeesPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/departments/:structureId/subdepartments" element={<SubdepartmentsPage />} />
        <Route path="/departments/:structureId/subdepartments/:departmentId" element={<DepartmentDetailPage />} />
        <Route path="/departments/:structureId/:departmentId/groups" element={<DepartmentGroupsPage />} />
        <Route path="/departments/:structureId/:departmentId/groups/:groupId/employees" element={<GroupEmployeesPage />} />
        <Route path="/duty-types" element={<DutyTypesPage />} />
        <Route path="/duty-distribution" element={<DutyDistributionPage />} />
        <Route path="/academic-duty" element={<AcademicDutyPage />} />
        <Route path="/duty-structures" element={<DutyStructuresPage />} />
        <Route path="/duty-structures/all" element={<AllDutyTypesPage />} />
        <Route path="/duty-structures/:structureId/all" element={<StructureAllDutyTypesPage />} />
        <Route path="/duty-structures/:structureId/subdepartments" element={<DutySubdepartmentsPage />} />
        <Route path="/duty-structures/:structureId/subdepartments/:subdepartmentId/duty-types" element={<DutyTypesByDepartmentPage />} />
        <Route path="/personnel-expense" element={<PersonnelExpensePage />} />
        <Route path="/personnel-expense/:structureId/subdepartments" element={<PersonnelExpenseSubdepartmentsPage />} />
        <Route path="/personnel-expense/:structureId/subdepartments/:departmentId/groups" element={<PersonnelExpenseGroupsPage />} />
        <Route path="/personnel-expense/:structureId/subdepartments/:departmentId/groups/:groupId/employees" element={<PersonnelExpenseGroupEmployeesPage />} />
        <Route path="/personnel-expense/:structureId/subdepartments/:departmentId/employees" element={<PersonnelExpenseEmployeesPage />} />
        <Route path="/personnel-expense/:structureId/employees/status/:status" element={<PersonnelExpenseStructureEmployeesPage />} />
      </Routes>
    </Layout>
  )
}

export default App 