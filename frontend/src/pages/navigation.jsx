import { useParams, Navigate } from "react-router-dom";

export default function OperatorNavigationPage() {
  const { id } = useParams();
  return <Navigate to={`/app/routes?id=${id}`} replace />;
}