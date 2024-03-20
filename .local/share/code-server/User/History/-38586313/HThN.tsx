import {
  Box,
  Button,
  Container,
  HStack,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import ReactJson from 'react-json-view';

import useTabList from './../tab-list/useTab';
import InvoiceCreateComponent from './InvoiceCreateComponent';

interface Invoice {
  id: string;
  invoice_id: string;
  company: string;
  parent_invoice_id: string;
  status: string;
  created_at: string;
  type: string;
}

export default function InvoiceDraftComponent() {
  const [invoices, setInvoices] = useState<undefined | Invoice[]>(undefined);
  const [statusButtonAtIndexIsLoading, setStatusButtonAtIndexIsLoading] = useState<
    number | undefined
  >(undefined);
  const [cancelButtonAtIndexIsLoading, setCancelButtonAtIndexIsLoading] = useState<
    number | undefined
  >(undefined);

  const [isSelectedId, setIsSelectedId] = useState<string | undefined>(undefined);
  const [selectedInvoiceData, setSelectedInvoiceData] = useState<any>(undefined);
  const [invoiceShowcaseIsLoading, setInvoiceShowcaseIsLoading] =
    useState<boolean>(false);

  const { tabs, addTab } = useTabList();

  useEffect(() => {
    async function getInvoice() {
      setInvoiceShowcaseIsLoading(true);
      const response = await fetch(
        `https://api-staging.storewise.in/api/invoice?id=${isSelectedId}`,
      );

      const invoiceData = await response.json();
      setSelectedInvoiceData(invoiceData);
      setInvoiceShowcaseIsLoading(false);
    }
    if (isSelectedId === undefined) {
      return;
    }
    getInvoice();
  }, [isSelectedId]);

  useEffect(() => {
    async function fetchInvoices() {
      const response = await fetch(
        `https://api-staging.storewise.in/api/invoices/draft?page=0&page_size=50
      `,
      );
      const result = await response.json();
      if (result && result.length > 0) {
        setIsSelectedId(result[0].id);
      }
      setInvoices(result);
    }
    fetchInvoices();
  }, []);

  const handleInvoiceDeleted = async (id: string, index: number) => {
    setCancelButtonAtIndexIsLoading(index);
    await fetch(
      `https://api-staging.storewise.in/invoice?force_delete=false&invoice_id=${id}`,
      { method: 'DELETE' },
    );
    setInvoices(invoices?.filter((i) => i.parent_invoice_id !== id));
    setCancelButtonAtIndexIsLoading(undefined);
  };

  const handleReleaseDraftInvoice = async (index: number) => {
    const invoice = invoices![index];
    addTab({
      invoiceId: invoice.id,
      title: invoice.invoice_id,
      component: <InvoiceCreateComponent />,
    });
  };

  if (invoices === undefined) {
    return (
      <Box textAlign={'center'}>
        <Spinner></Spinner>
      </Box>
    );
  }

  if (selectedInvoiceData) {
    Object.keys(selectedInvoiceData).forEach(function (key, index) {
      selectedInvoiceData['id'] = 'ch';
    });
  }
  return (
    <Container width={'100%'} minW={'100%'} p={10}>
      <HStack alignItems={'start'}>
        <TableContainer>
          <Table minWidth="800" variant="simple">
            <Thead>
              <Tr>
                <Th>Date</Th>
                <Th>Invoice Id</Th>
                <Th>Company</Th>
                <Th> Type</Th>
                <Th maxWidth={2}></Th>
              </Tr>
            </Thead>
            <Tbody>
              {invoices.map((item, index) => {
                return (
                  <Tr
                    onClick={() => setIsSelectedId(item.id)}
                    background={isSelectedId === item.id ? '#aaaaaa' : undefined}
                    key={item.id}
                  >
                    <Td> {item.created_at} </Td>
                    <Td>{item.invoice_id}</Td>
                    <Td> {item.company}</Td>
                    <Td> {item.type}</Td>
                    <Td>
                      <Button
                        isLoading={statusButtonAtIndexIsLoading === index}
                        colorScheme={'blue'}
                        onClick={() => handleReleaseDraftInvoice(index)}
                      >
                        {' '}
                        Release ➡️
                      </Button>
                    </Td>
                    <Td>
                      <Button
                        isLoading={cancelButtonAtIndexIsLoading === index}
                        colorScheme={'red'}
                        onClick={() => handleInvoiceDeleted(item.id, index)}
                      >
                        {' '}
                        Cancel
                      </Button>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </TableContainer>
        <Box maxW={'50%'}>
          {invoiceShowcaseIsLoading ? (
            <Spinner />
          ) : (
            <ReactJson src={selectedInvoiceData}></ReactJson>
          )}
        </Box>
      </HStack>
    </Container>
  );
}
