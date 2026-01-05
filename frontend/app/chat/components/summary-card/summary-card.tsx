import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { generateNotePdf, Note } from '@/services/agent';
import { useMutation } from '@tanstack/react-query';
import { Copy, FileText, Download } from 'lucide-react-native'; // Assuming Lucide for icons
import ReactMarkdown from 'react-markdown';
import { useState, useCallback } from 'react';

type EventSummaryProps = {
  sessionId: string;
  note: Note | undefined;
  hasCompleted: boolean;
};

const MarkdownComponents = {
  // Headings
  h1: ({ children }: any) => (
    <h1 className="text-typography-900 mb-4 mt-6 text-3xl font-bold">{children}</h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-typography-800 border-outline-100 mb-3 mt-5 border-b pb-1 text-2xl font-semibold">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-typography-800 mb-2 mt-4 text-xl font-medium">{children}</h3>
  ),

  // Text & Links
  p: ({ children }: any) => (
    <p className="text-typography-700 mb-4 text-base leading-7 last:mb-0">{children}</p>
  ),
  a: ({ href, children }: any) => (
    <a
      href={href}
      className="text-primary-600 underline transition-colors hover:text-primary-700"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),

  // Lists
  ul: ({ children }: any) => (
    <ul className="text-typography-700 mb-4 ml-6 list-disc space-y-2">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="text-typography-700 mb-4 ml-6 list-decimal space-y-2">{children}</ol>
  ),
  li: ({ children }: any) => <li className="pl-1">{children}</li>,

  // Blocks
  blockquote: ({ children }: any) => (
    <blockquote className="text-typography-600 my-4 border-l-4 border-primary-500 pl-4 italic">
      {children}
    </blockquote>
  ),
  code: ({ children }: any) => (
    <code className="bg-background-100 text-secondary-700 rounded px-1.5 py-0.5 font-mono text-sm">
      {children}
    </code>
  ),
  hr: () => <hr className="border-outline-200 my-8" />,
};

export const useCopyToClipboard = () => {
  const [isCopied, setIsCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    if (!navigator?.clipboard) {
      console.warn('Clipboard not supported');
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2s
      return true;
    } catch (error) {
      console.error('Copy failed', error);
      setIsCopied(false);
      return false;
    }
  }, []);

  return { isCopied, copy };
};

const EventSummary = ({ sessionId, note, hasCompleted }: EventSummaryProps) => {
  const { copy } = useCopyToClipboard();

  const { mutate: generateNotePdfMutate } = useMutation({
    mutationFn: generateNotePdf,
    onSuccess: (blob) => {
      // Handle the browser download trigger
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'note.pdf';
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      a.remove();
    },
    onError: (error) => {
      console.error('Download failed:', error);
    },
  });

  return (
    <Box className="mt-2 w-full max-w-[448px] overflow-hidden rounded-xl border-l-4 border-[#10b981] bg-white shadow-xl ring-1 ring-black/5">
      {/* Background Decorative Icon */}
      <Box className="pointer-events-none absolute right-0 top-0 p-4 opacity-5">
        <Icon as={FileText} className="rotate-12 text-slate-900" />
      </Box>

      <VStack space="md" className="relative z-10 p-5">
        {/* Header Section */}
        <HStack className="border-b border-slate-200 pb-3">
          <VStack>
            <Heading size="md" className="font-bold tracking-tight text-slate-900">
              Event Summary
            </Heading>
            <Text className="text-xs font-medium uppercase tracking-wider text-[#059669]">
              Ready for Review
            </Text>
          </VStack>

          <Box className="mx-3 rounded-lg bg-slate-100 p-3">
            <Icon as={FileText} className="text-slate-500" />
          </Box>
        </HStack>

        {/* Data Grid */}
        <Box className="rounded-lg border border-slate-200 bg-slate-100/50 p-3">
          <Text className="text-sm italic leading-relaxed text-slate-500">
            <ReactMarkdown components={MarkdownComponents}>{note?.summary ?? ''}</ReactMarkdown>
          </Text>
        </Box>

        {/* Action Buttons */}
        {hasCompleted && (
          <HStack space="sm" className="pt-2">
            <Button
              className="h-9 flex-1 rounded-md border border-slate-200 bg-slate-100"
              variant="outline"
              onPress={() => copy(note?.summary ?? '')}
            >
              <ButtonIcon as={Copy} size="xs" className="mr-2 text-slate-900" />
              <ButtonText className="text-xs font-bold text-slate-900">Copy Note</ButtonText>
            </Button>

            <Button
              className="h-9 flex-1 rounded-md border border-slate-900 bg-slate-900"
              onPress={() => generateNotePdfMutate({ sessionId })}
            >
              <ButtonIcon as={Download} size="xs" className="mr-2 text-white" />
              <ButtonText className="text-xs font-bold text-white">Download PDF</ButtonText>
            </Button>
          </HStack>
        )}
      </VStack>
    </Box>
  );
};

export default EventSummary;
