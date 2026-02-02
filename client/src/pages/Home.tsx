import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Users, Phone, User, ArrowRight, Loader2 } from "lucide-react";
import { CustomerLayout } from "@/components/CustomerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateQueueEntry } from "@/hooks/use-queue";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const formSchema = z.object({
  name: z.string().min(1, "Name is helpful!"),
  phoneNumber: z.string().regex(/^\d{10}$/, "Please enter a valid 10-digit phone number"),
  numberOfPeople: z.coerce.number().min(1, "At least 1 person").max(10, "Max 10 people"),
});

type FormData = z.infer<typeof formSchema>;

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { mutate: joinQueue, isPending } = useCreateQueueEntry();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
      numberOfPeople: 2,
    },
  });

  const onSubmit = (data: FormData) => {
    joinQueue(data, {
      onSuccess: (entry) => {
        toast({
          title: "Welcome to the queue!",
          description: `You are #${entry.queueNumber} in line.`,
        });
        setLocation(`/queue/${entry.queueNumber}`);
      },
      onError: (err) => {
        toast({
          title: "Could not join queue",
          description: err.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <CustomerLayout>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold font-display text-stone-800">Join the Queue</h2>
        <p className="text-stone-500 mt-2">Get in line from anywhere. We'll text you when your table is ready.</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-600 flex items-center gap-2">
              <User className="w-4 h-4 text-orange-500" />
              Your Name
            </label>
            <Input
              {...form.register("name")}
              placeholder="e.g. Alex"
              className="bg-stone-50 border-stone-200 focus:ring-orange-500 focus:border-orange-500 h-12 text-lg rounded-xl"
            />
            {form.formState.errors.name && (
              <p className="text-red-500 text-xs font-medium">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-600 flex items-center gap-2">
              <Phone className="w-4 h-4 text-orange-500" />
              Mobile Number
            </label>
            <Input
              {...form.register("phoneNumber")}
              type="tel"
              placeholder="e.g. 9876543210"
              className="bg-stone-50 border-stone-200 focus:ring-orange-500 focus:border-orange-500 h-12 text-lg rounded-xl tracking-wider"
              maxLength={10}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                if (val.length <= 10) {
                  form.setValue("phoneNumber", val);
                }
              }}
            />
            {form.formState.errors.phoneNumber && (
              <p className="text-red-500 text-xs font-medium">{form.formState.errors.phoneNumber.message}</p>
            )}
          </div>

          {/* Party Size Field */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-600 flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-500" />
              Party Size
            </label>
            <div className="flex gap-2 justify-between">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => form.setValue("numberOfPeople", num)}
                  className={`
                    flex-1 aspect-square rounded-xl font-bold text-lg transition-all duration-200
                    ${form.watch("numberOfPeople") === num 
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-105" 
                      : "bg-stone-100 text-stone-500 hover:bg-stone-200"}
                  `}
                >
                  {num}
                </button>
              ))}
            </div>
            {/* Custom size input fallback */}
            <div className="mt-2">
               <Input 
                type="number" 
                min={1} 
                max={10}
                {...form.register("numberOfPeople")}
                className="bg-stone-50 h-10 text-center"
                placeholder="Custom size"
              />
            </div>
             {form.formState.errors.numberOfPeople && (
              <p className="text-red-500 text-xs font-medium">{form.formState.errors.numberOfPeople.message}</p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-14 text-lg font-bold rounded-xl orange-gradient text-white shadow-xl shadow-orange-500/20 hover:scale-[1.02] transition-transform"
        >
          {isPending ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              Proceed
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </form>
    </CustomerLayout>
  );
}
