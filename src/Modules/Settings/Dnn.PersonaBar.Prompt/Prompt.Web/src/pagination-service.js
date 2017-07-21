
export default class PaginationService {
    constructor(prompt){
        this.prompt = prompt;
        this.shouldPaginate = false;
        this.currentPageInfo
    }

    dump(){
        console.log(this);
    }

    isPaginationRequired(res){
        (res.pagingInfo) ? this.currentPageInfo=res.pagingInfo : null;
        this.shouldPaginate = (this.currentPageInfo) ? true : false;
        this.dump();
        return res;
    }

    nextPage(fn){

    }

}