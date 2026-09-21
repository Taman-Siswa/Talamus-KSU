import { SCHOOLS } from '@/data/schools';
import AdminSchoolRoute from '@/components/admin/AdminSchoolRoute';

// '_' is the placeholder page the static Firebase build serves for schools the admin adds later.
export const generateStaticParams = () => [...SCHOOLS.map(s => ({ schoolId: s.id })), { schoolId: '_' }];

export default function AdminSchoolPage() {
  return <AdminSchoolRoute />;
}
