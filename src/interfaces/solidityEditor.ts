export interface ModuleMetadata {
    /**
     * The import statement for the module.
     * For example: `import "@openzeppelin/contracts/token/ERC20/ERC20.sol";`
     */
    import: string;

    /**
     * The inheritance statement for the module.
     * For example: `ERC20`
     */
    inheritance: string;

    /**
     * The constructor of the module.
     * If the module does not have a constructor, this should be `null`.
     */
    constructor?: ModuleConstructor;

    /**
     * An array of methods for the module.
     * For example:
     * `[
     *      {
     *          name: 'mint',
     *          body: 'function mint(address to, uint256 amount) public onlyOwner { _mint(to, amount); }'
     *      }
     *  ]`
     */
    methods?: ModuleMethod[];
}

export interface ModuleConstructor {
    /**
     * The parameters of the constructor.
     * For example: `['string memory name', 'string memory symbol']`
     */
    params: string[];

    /**
     * The body of the constructor.
     * For example: `ERC20(name, symbol)`
     */
    body: string;

    /**
     * The placement of the constructor.
     * Can be either `initialization_list` or `body`.
     * In cases like ERC20, ERC721, etc., the constructor is placed in the initialization list.
     * In other cases, the constructor body is placed in the constructor body itself
     */
    placement: 'initialization_list' | 'body';
}

export interface ModuleMethod {
    /**
     * The name of the method.
     * For example: `mint`
     */
    name: string;

    /**
     * The body of the method.
     * For example: `function mint(address to, uint256 amount) public onlyOwner { _mint(to, amount); }`
     */
    body: string;
}
