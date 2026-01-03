import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';

const LoadingMessage = () => {
  return (
    <HStack space="md" className="mx-auto mb-8 w-full max-w-3xl flex-shrink-0">
      <VStack className="max-w-[85%] gap-2 md:max-w-[75%]">
        <Box className="w-fit rounded-2xl rounded-tl-none border border-border-light bg-surface p-4 shadow-sm">
          <HStack space="xs" className="h-4">
            {/* Animated Dots */}
            <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
            <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
            <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
          </HStack>
        </Box>
      </VStack>
    </HStack>
  );
};

export default LoadingMessage;
