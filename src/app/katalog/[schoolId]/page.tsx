import { SCHOOLS } from '@/data/schools';
import SchoolProfileRoute from '@/components/SchoolProfileRoute';

// '_' is the placeholder page the static Firebase build serves for schools the admin adds later.
export const generateStaticParams = () => [...SCHOOLS.map(s => ({ schoolId: s.id })), { schoolId: '_' }];

export async function generateMetadata({ params }: PageProps<'/katalog/[schoolId]'>) {
  const { schoolId } = await params;
  const school = SCHOOLS.find(s => s.id === schoolId);
  return { title: school ? school.name + ' — KSU' : 'KSU' };
}

export default function SchoolPage() {
  // The profile is a client component: it reads the school data the admin may have edited,
  // and takes the school id from the address (see useRouteId).
  return <SchoolProfileRoute />;
}
