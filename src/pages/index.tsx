
import { ApiKeysTester } from "@/components/ApiKeysTester";

export default function IndexPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">API Configuration</h1>
      <ApiKeysTester />
    </div>
  );
}
