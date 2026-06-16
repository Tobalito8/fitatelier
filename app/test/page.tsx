import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestPage() {
  return (
    <div className="p-10">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>FitAtelier</CardTitle>
        </CardHeader>

        <CardContent>
          <Button>Botón de prueba</Button>
        </CardContent>
      </Card>
    </div>
  );
}
