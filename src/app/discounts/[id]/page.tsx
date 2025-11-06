import DiscountForm from '../components/DiscountForm';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
export default function EditDiscountPage({ params }: { params: { id: string } }) {
  return (
    <DefaultLayout>
      <DiscountForm params={params} />
    </DefaultLayout>
  );
} 