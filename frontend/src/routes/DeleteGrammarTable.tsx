import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import {
  deleteGrammarTable, getGrammarTableById, IGrammarTable
} from '../grammarData.tsx';
import { useSetPageTitle } from '../utils.tsx';

function DeleteGrammarTableInner({ table }: { table: IGrammarTable }) {
  const navigate = useNavigate();

  const [ errorMessage, setErrorMessage ] = useState("");
  
  async function deleteFormTable() {
    const result = await deleteGrammarTable(table.id);
    if(!result.ok) {
      setErrorMessage(result.body.message);
      return;
    }
    
    navigate("/grammar-tables");
  }
  
  return (
    <>
      <h2>Delete Grammar Table</h2>
      <p>
        Really delete { table.name && "grammar table "}
        <Link to={ '/table/' + table.id }>{ table.name || "this grammar table" }</Link>?
      </p>
      <p>
        <b>This action cannot be undone!</b>
      </p>
      <button onClick={deleteFormTable} style={{ marginBottom: "15px" }}>
        Delete grammar table
      </button>
      <br />
      <button onClick={ () => navigate(-1) }>
        Go back
      </button>
      { errorMessage && <p><b>Error: {errorMessage}</b></p> }
    </>
  );
};

export default function DeleteGrammarTable() {
  const { id: tableId } = useParams();
  if(!tableId) {
    throw new Error("No table ID was provided");
  }
  
  const tableResponse = getGrammarTableById(tableId);
  
  useSetPageTitle("Delete Grammar Table");

  if(tableResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(tableResponse.status === 'error') {
    return (
      <>
        <h2>{ tableResponse.error.title }</h2>
        <p>{ tableResponse.error.message }</p>
      </>
    );
  }

  return <DeleteGrammarTableInner table={ tableResponse.data } />;
};
