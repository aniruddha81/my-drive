import FileUpload from "@/components/fileUploader";
import { ModeToggle } from "@/components/themeToggle";

export default function Home() {
  return (
    <div>
      <ModeToggle />
      <FileUpload />
    </div>
  );
}
